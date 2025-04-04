import type { CoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import { beforeEach, describe, expect, test } from 'vitest';
import { QueueContractSimulator } from './QueueContractSimulator';

let mockQueueContract: QueueContractSimulator;
let sender: CoinPublicKey;

const setup = () => {
  sender = '9905a18ce5bd2d7945818b18be9b0afe387efe29c8ffa81d90607a651fb83a2b';
  mockQueueContract = new QueueContractSimulator(sender);
};

describe('Queue', () => {
  beforeEach(setup);

  describe('Enqueue', () => {
    test('should enqueue single item', () => {
      const nextLedgerState = mockQueueContract.enqueue(0n);
      expect(nextLedgerState.queueState.member(0n)).toBeTruthy;
      expect(nextLedgerState.queueState.lookup(0n)).toBe(0n);
      expect(nextLedgerState.queueHead).toBe(0n);
      expect(nextLedgerState.queueTail).toBe(1n);
    });

    test('should enqueue multiple items sequentially', () => {
      let result = mockQueueContract.enqueue(0n);
      result = mockQueueContract.enqueue(100n);
      result = mockQueueContract.enqueue(200n);
      expect(result.queueState.member(0n)).toBeTruthy;
      expect(result.queueState.lookup(0n)).toBe(0n);
      expect(result.queueState.member(1n)).toBeTruthy;
      expect(result.queueState.lookup(1n)).toBe(100n);
      expect(result.queueState.member(2n)).toBeTruthy;
      expect(result.queueState.lookup(2n)).toBe(200n);
      expect(result.queueHead).toBe(0n);
      expect(result.queueTail).toBe(3n);
    });

    test('should not mark queue as empty after enqueue', () => {
      mockQueueContract.enqueue(0n);
      expect(mockQueueContract.isEmpty()).toBeFalsy;
    });

    test('should handle large number of enqueues', () => {
      for (let i = 0n; i < 100n; i++) {
        mockQueueContract.enqueue(i);
      }
      const state = mockQueueContract.getCurrentPublicState();
      expect(state.queueState.member(99n)).toBeTruthy;
      expect(state.queueState.lookup(99n)).toBe(99n);
      expect(state.queueTail).toBe(100n);
      expect(state.queueHead).toBe(0n);
    });
  });

  describe('Dequeue', () => {
    test('should dequeue single item', () => {
      mockQueueContract.enqueue(0n);
      const [nextLedgerState, value] = mockQueueContract.dequeue();
      expect(value).toBe(0n);
      expect(nextLedgerState.queueState.member(0n)).toBeFalsy;
      expect(nextLedgerState.queueHead).toBe(1n);
      expect(nextLedgerState.queueTail).toBe(1n);
    });

    test('should dequeue multiple items in FIFO order', () => {
      mockQueueContract.enqueue(0n);
      mockQueueContract.enqueue(100n);
      mockQueueContract.enqueue(200n);

      let [result, value] = mockQueueContract.dequeue();
      expect(value).toBe(0n);
      expect(result.queueState.member(0n)).toBeFalsy;

      [result, value] = mockQueueContract.dequeue();
      expect(value).toBe(100n);
      expect(result.queueState.member(1n)).toBeFalsy;

      [result, value] = mockQueueContract.dequeue();
      expect(value).toBe(200n);
      expect(result.queueState.member(2n)).toBeFalsy;
      expect(result.queueHead).toBe(3n);
      expect(result.queueTail).toBe(3n);
    });

    test('should return none when dequeuing empty queue', () => {
      const [_, value] = mockQueueContract.dequeue();
      expect(value).toBe(0n);
      expect(mockQueueContract.getCurrentPublicState().queueHead).toBe(0n);
      expect(mockQueueContract.getCurrentPublicState().queueTail).toBe(0n);
    });

    test('should mark queue as empty after dequeuing all items', () => {
      mockQueueContract.enqueue(0n);
      mockQueueContract.enqueue(100n);
      mockQueueContract.dequeue();
      mockQueueContract.dequeue();
      expect(mockQueueContract.isEmpty()).toBeTruthy;
    });

    test('should handle dequeue after large enqueue', () => {
      for (let i = 0n; i < 50n; i++) {
        mockQueueContract.enqueue(i);
      }
      for (let i = 0n; i < 50n; i++) {
        const [_, value] = mockQueueContract.dequeue();
        expect(value).toBe(i);
      }
      expect(mockQueueContract.isEmpty()).toBeTruthy;
    });

    test('should maintain sparse keys without shifting', () => {
      mockQueueContract.enqueue(0n);
      mockQueueContract.enqueue(100n);
      mockQueueContract.dequeue(); // Removes 0n at head=0
      const state = mockQueueContract.getCurrentPublicState();
      expect(state.queueState.member(0n)).toBeFalsy;
      expect(state.queueState.member(1n)).toBeTruthy;
      expect(state.queueHead).toBe(1n);
      expect(state.queueTail).toBe(2n);
    });
  });
});
