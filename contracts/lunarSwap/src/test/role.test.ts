import { test, beforeEach, expect } from 'vitest';
import { RoleContractMock } from './mock/roleContract';
import { CoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';

let roleContract: RoleContractMock;
let admin: CoinPublicKey;

beforeEach(() => {
  admin = sampleCoinPublicKey();
  roleContract = new RoleContractMock(admin);
});

test('initialize', () => {
  const state = roleContract.getLedger();

  const roleCommit = state.roleCommits.root();
  const leaf = state.roleCommits.firstFree();

  expect(!state.roleCommits.isFull(), "It is not full!")
});
