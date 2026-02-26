'use client';

import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useShieldedTokenContext } from '@/lib/shielded-token-context';
import { useMidnightWallet } from '@/lib/wallet-context';

interface MintTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the modal will auto-join this contract and skip to the mint step */
  initialContractAddress?: string;
}

export function MintTokenModal({
  open,
  onOpenChange,
  initialContractAddress,
}: MintTokenModalProps) {
  const {
    joinToken,
    mintTokens,
    mintStatus,
    mintError,
    activeTokenAddress,
    clearMintState,
  } = useShieldedTokenContext();
  const { walletAPI } = useMidnightWallet();
  const [contractAddress, setContractAddress] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const normalizedInitial =
    initialContractAddress?.trim().replace(/^0x/, '') ?? '';

  useEffect(() => {
    if (open && normalizedInitial && !activeTokenAddress) {
      joinToken(normalizedInitial);
    }
  }, [open, normalizedInitial, activeTokenAddress, joinToken]);

  useEffect(() => {
    if (open && walletAPI?.coinPublicKey && !recipient) {
      setRecipient(walletAPI.coinPublicKey);
    }
  }, [open, walletAPI?.coinPublicKey, recipient]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        clearMintState();
        setContractAddress('');
        setRecipient('');
        setAmount('');
      }
      onOpenChange(next);
    },
    [clearMintState, onOpenChange],
  );

  const handleJoin = useCallback(() => {
    const hex = contractAddress.trim().replace(/^0x/, '');
    if (!hex) return;
    joinToken(hex);
  }, [contractAddress, joinToken]);

  const isAmountValid = (s: string): boolean => {
    const t = s.trim();
    if (!t) return false;
    try {
      return BigInt(t) > 0n;
    } catch {
      return false;
    }
  };

  const showJoinStep = !activeTokenAddress && !normalizedInitial;
  const isJoining = mintStatus === 'joining';
  const isMinting = mintStatus === 'minting';
  const showMintStep = !!activeTokenAddress;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mint Shielded Tokens</DialogTitle>
          <DialogDescription>
            Join an existing shielded token contract by address, then mint
            tokens to a recipient&apos;s coin public key.
          </DialogDescription>
        </DialogHeader>

        {showJoinStep ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="contract-address">Contract Address (hex)</Label>
                <Input
                  id="contract-address"
                  placeholder="Contract address with or without 0x"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  disabled={isJoining}
                  className="font-mono text-xs"
                />
              </div>
              {isJoining && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Joining contract...</span>
                </div>
              )}
              {mintStatus === 'error' && mintError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {mintError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isJoining}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleJoin}
                disabled={isJoining || !contractAddress.trim()}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Contract'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : normalizedInitial && !activeTokenAddress ? (
          <div className="space-y-4 py-4">
            {isJoining ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                <span>Joining contract...</span>
              </div>
            ) : mintStatus === 'error' && mintError ? (
              <>
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {mintError}
                </div>
                <DialogFooter>
                  <Button type="button" onClick={() => handleOpenChange(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </div>
        ) : showMintStep ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="rounded border bg-muted/30 p-2 font-mono text-xs text-muted-foreground break-all">
                Contract: {activeTokenAddress}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mint-recipient">
                  Recipient (coin public key)
                </Label>
                <Input
                  id="mint-recipient"
                  placeholder="Bech32m coin public key"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={isMinting}
                  className="font-mono text-xs"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mint-amount">Amount</Label>
                <Input
                  id="mint-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isMinting}
                />
              </div>
              {isMinting && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>Minting... (proof generation may take a minute)</span>
                </div>
              )}
              {mintStatus === 'minted' && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-800 dark:text-green-200">
                  Tokens minted successfully.
                </div>
              )}
              {mintStatus === 'error' && mintError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {mintError}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  const trimmedRecipient = recipient.trim();
                  if (!trimmedRecipient || !isAmountValid(amount)) return;
                  await mintTokens(trimmedRecipient, BigInt(amount.trim()));
                }}
                disabled={
                  isMinting || !recipient.trim() || !isAmountValid(amount)
                }
              >
                {isMinting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  'Mint Tokens'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
