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
      // After enqueue, the item should be at position 0 (tail starts at 0)
      expect(nextLedgerState.state.member(0n)).toBe(true);
      expect(nextLedgerState.state.lookup(0n)).toBe(0n);
      expect(nextLedgerState.head).toBe(0n);
      expect(nextLedgerState.tail).toBe(1n);
    });

    test('should enqueue multiple items sequentially', () => {
      let result = mockQueueContract.enqueue(0n);
      result = mockQueueContract.enqueue(100n);
      result = mockQueueContract.enqueue(200n);
      // Items should be at positions 0, 1, 2
      expect(result.state.member(0n)).toBe(true);
      expect(result.state.lookup(0n)).toBe(0n);
      expect(result.state.member(1n)).toBe(true);
      expect(result.state.lookup(1n)).toBe(100n);
      expect(result.state.member(2n)).toBe(true);
      expect(result.state.lookup(2n)).toBe(200n);
      expect(result.head).toBe(0n);
      expect(result.tail).toBe(3n);
    });

    test('should not mark queue as empty after enqueue', () => {
      mockQueueContract.enqueue(0n);
      expect(mockQueueContract.isEmpty()).toBe(false);
    });

    test('should handle large number of enqueues', () => {
      for (let i = 0n; i < 100n; i++) {
        mockQueueContract.enqueue(i);
      }
      const state = mockQueueContract.getCurrentPublicState();
      expect(state.state.member(99n)).toBe(true);
      expect(state.state.lookup(99n)).toBe(99n);
      expect(state.tail).toBe(100n);
      expect(state.head).toBe(0n);
    });
  });

  describe('Dequeue', () => {
    test('should dequeue single item', () => {
      mockQueueContract.enqueue(0n);
      const [nextLedgerState, value] = mockQueueContract.dequeue();
      expect(value).toBe(0n);
      expect(nextLedgerState.state.member(0n)).toBe(false);
      expect(nextLedgerState.head).toBe(1n);
      expect(nextLedgerState.tail).toBe(1n);
    });

    test('should dequeue multiple items in FIFO order', () => {
      mockQueueContract.enqueue(0n);
      mockQueueContract.enqueue(100n);
      mockQueueContract.enqueue(200n);

      let [result, value] = mockQueueContract.dequeue();
      expect(value).toBe(0n);
      expect(result.state.member(0n)).toBe(false);

      [result, value] = mockQueueContract.dequeue();
      expect(value).toBe(100n);
      expect(result.state.member(1n)).toBe(false);

      [result, value] = mockQueueContract.dequeue();
      expect(value).toBe(200n);
      expect(result.state.member(2n)).toBe(false);
      expect(result.head).toBe(3n);
      expect(result.tail).toBe(3n);
    });

    test('should return none when dequeuing empty queue', () => {
      const [_, value] = mockQueueContract.dequeue();
      // When queue is empty, dequeue should return 0 (none value)
      expect(value).toBe(0n);
      expect(mockQueueContract.getCurrentPublicState().head).toBe(0n);
      expect(mockQueueContract.getCurrentPublicState().tail).toBe(0n);
    });

    test('should mark queue as empty after dequeuing all items', () => {
      mockQueueContract.enqueue(0n);
      mockQueueContract.enqueue(100n);
      mockQueueContract.dequeue();
      mockQueueContract.dequeue();
      expect(mockQueueContract.isEmpty()).toBe(true);
    });

    test('should handle dequeue after large enqueue', () => {
      for (let i = 0n; i < 50n; i++) {
        mockQueueContract.enqueue(i);
      }
      for (let i = 0n; i < 50n; i++) {
        const [_, value] = mockQueueContract.dequeue();
        expect(value).toBe(i);
      }
      expect(mockQueueContract.isEmpty()).toBe(true);
    });

    test('should maintain sparse keys without shifting', () => {
      mockQueueContract.enqueue(0n);
      mockQueueContract.enqueue(100n);
      mockQueueContract.dequeue(); // Removes 0n at head=0
      const state = mockQueueContract.getCurrentPublicState();
      expect(state.state.member(0n)).toBe(false);
      expect(state.state.member(1n)).toBe(true);
      expect(state.head).toBe(1n);
      expect(state.tail).toBe(2n);
    });
  });
});
