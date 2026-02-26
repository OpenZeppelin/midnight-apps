'use client';

import { Loader2, Plus } from 'lucide-react';
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

interface DeployTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeployTokenModal({
  open,
  onOpenChange,
}: DeployTokenModalProps) {
  const {
    deployToken,
    deployStatus,
    deployError,
    clearDeployState,
    mintTokens,
    mintStatus,
    mintError,
    clearMintState,
  } = useShieldedTokenContext();
  const { walletAPI } = useMidnightWallet();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [result, setResult] = useState<{
    contractAddress: string;
    tokenType: string;
  } | null>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (deployStatus === 'deployed' && walletAPI?.coinPublicKey && !recipient) {
      setRecipient(walletAPI.coinPublicKey);
    }
  }, [deployStatus, walletAPI?.coinPublicKey, recipient]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        clearDeployState();
        clearMintState();
        setResult(null);
        setName('');
        setSymbol('');
        setRecipient('');
        setAmount('');
      }
      onOpenChange(next);
    },
    [clearDeployState, clearMintState, onOpenChange],
  );

  const handleDeploy = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedSymbol = symbol.trim();
    if (!trimmedName || !trimmedSymbol) return;
    setResult(null);
    const res = await deployToken(trimmedName, trimmedSymbol);
    if (res) {
      setResult({
        contractAddress: res.contractAddress,
        tokenType: res.tokenType,
      });
    }
  }, [deployToken, name, symbol]);

  const isDeploying = deployStatus === 'deploying';
  const isDeployed = deployStatus === 'deployed' && result;
  const hasError = deployStatus === 'error';

  const isAmountValid = (s: string): boolean => {
    const t = s.trim();
    if (!t) return false;
    try {
      return BigInt(t) > 0n;
    } catch {
      return false;
    }
  };

  const formatShort = (hex: string) =>
    hex.length > 20 ? `${hex.slice(0, 10)}...${hex.slice(-8)}` : hex;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deploy Shielded Token</DialogTitle>
          <DialogDescription>
            Deploy a new shielded fungible token contract on the network. You
            can use it to create liquidity pools after deployment.
          </DialogDescription>
        </DialogHeader>

        {!isDeployed ? (
          <>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="token-name">Token Name</Label>
                <Input
                  id="token-name"
                  placeholder="e.g. My Token"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isDeploying}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="token-symbol">Token Symbol</Label>
                <Input
                  id="token-symbol"
                  placeholder="e.g. MTK"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  disabled={isDeploying}
                />
              </div>

              {isDeploying && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  <span>
                    Deploying... (proof generation and transaction submission
                    may take a minute)
                  </span>
                </div>
              )}

              {hasError && deployError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {deployError}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isDeploying}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeploy}
                disabled={isDeploying || !name.trim() || !symbol.trim()}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Deploy Token
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-800 dark:text-green-200">
              <p className="font-medium">Token deployed successfully</p>
              <p className="mt-1 text-muted-foreground">
                You can now create a liquidity pool with this token or mint
                tokens below.
              </p>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Contract Address</Label>
              <div className="rounded border bg-muted/30 p-2 font-mono text-xs break-all">
                {result?.contractAddress ?? ''}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">
                Token Type (for pools)
              </Label>
              <div className="rounded border bg-muted/30 p-2 font-mono text-xs break-all">
                {formatShort(result?.tokenType ?? '')}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <p className="text-sm font-medium">Mint Tokens</p>
              <div className="grid gap-2">
                <Label htmlFor="mint-recipient">
                  Recipient (coin public key)
                </Label>
                <Input
                  id="mint-recipient"
                  placeholder="Bech32m coin public key"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  disabled={mintStatus === 'minting'}
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
                  disabled={mintStatus === 'minting'}
                />
              </div>
              {mintStatus === 'minting' && (
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
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  const trimmedRecipient = recipient.trim();
                  if (!trimmedRecipient || !isAmountValid(amount)) return;
                  const amountBigInt = BigInt(amount.trim());
                  await mintTokens(trimmedRecipient, amountBigInt);
                }}
                disabled={
                  mintStatus === 'minting' ||
                  !recipient.trim() ||
                  !isAmountValid(amount)
                }
              >
                {mintStatus === 'minting' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  'Mint Tokens'
                )}
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
