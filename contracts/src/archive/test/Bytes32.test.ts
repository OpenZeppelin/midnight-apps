import { beforeEach, describe, expect, test } from 'vitest';
import { Bytes32Simulator } from './mocks/Bytes32Simulator.js';

let bytes32Simulator: Bytes32Simulator;

const setup = () => {
  bytes32Simulator = new Bytes32Simulator();
};

/**
 * TODO: Fix in a separate PR
 *
 * These tests are skipped because Bytes32.compact depends on Field255 which is archived
 * due to Compact Uint limitations:
 * - v0.26.0: Max Uint<254> — Field values >= 2^254 truncated
 * - v0.27.0: Max Uint<248> (31 bytes) — Field values >= 2^248 truncated
 *
 * The JubJub scalar field requires 255 bits, but Compact cannot represent values >= 2^248.
 * See Field255.compact.archive and Bytes32.compact.archive for full details.
 */
describe.skip('Bytes32', () => {
  beforeEach(setup);

  describe('Type Conversion Functions', () => {
    describe('fromBytes', () => {
      test('should convert bytes to field', () => {
        const bytes = createBytes(1n);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThanOrEqual(0n);
      });

      test('should convert zero bytes to zero field', () => {
        const bytes = new Uint8Array(32);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(field).toBe(0n);
      });

      test('should convert large bytes to field', () => {
        const bytes = createBytes(2n ** 256n - 1n);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(field).toBeGreaterThan(0n);
      });

      test('should handle bytes with mixed values', () => {
        const bytes = createBytes(1234567890123456789012345678901234567890n);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(field).toBeGreaterThan(0n);
      });

      test('should handle maximum field value bytes', () => {
        const bytes = createMaxFieldBytes();
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThan(0n);
        // Field should be within 254-bit range
        expect(field).toBeLessThan(2n ** 254n);
      });

      test('should handle bytes with only first byte set', () => {
        const bytes = createPatternBytes(0xff, 0);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThan(0n);
      });

      test('should handle bytes just above field size', () => {
        const bytes = createOverflowBytes();
        expect(() => bytes32Simulator.fromBytes(bytes)).toThrow(
          'Bytes32: toField() - inputs exceed the field size',
        );
      });

      test('should handle bytes with only last byte set to 0xF', () => {
        const bytes = createPatternBytes(0xf, 31);
        expect(() => bytes32Simulator.fromBytes(bytes)).toThrow(
          'Bytes32: toField() - inputs exceed the field size',
        );
      });

      test('should handle bytes with only last byte set to 0x01', () => {
        const bytes = createPatternBytes(0x01, 31);
        expect(() => bytes32Simulator.fromBytes(bytes)).toThrow(
          'Bytes32: toField() - inputs exceed the field size',
        );
      });

      test('should handle bytes with only last byte set to 0x00', () => {
        const bytes = createPatternBytes(0x00, 31);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        // When the last byte is set to 0x00, all bytes are zero,
        // so fromBytes returns 0
        expect(field).toBe(0n);
      });

      test('should handle bytes with alternating pattern', () => {
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          bytes[i] = i % 2 === 0 ? 0xff : 0x00;
        }
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThan(0n);
      });
    });

    describe('toBytes', () => {
      test('should convert field to bytes', () => {
        const field = 1n;
        const bytes = bytes32Simulator.toBytes(field);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should convert zero field to zero bytes', () => {
        const field = 0n;
        const bytes = bytes32Simulator.toBytes(field);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
        // Check that all bytes are zero
        for (let i = 0; i < 32; i++) {
          expect(bytes[i]).toBe(0);
        }
      });

      test('should convert large field to bytes', () => {
        const field = 123456789n;
        const bytes = bytes32Simulator.toBytes(field);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should convert maximum field value to bytes', () => {
        const maxField = 2n ** 254n - 1n;
        const bytes = bytes32Simulator.toBytes(maxField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should handle field values near maximum', () => {
        const nearMaxField = 2n ** 254n - 1000n;
        const bytes = bytes32Simulator.toBytes(nearMaxField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should round-trip conversion work for small values', () => {
        const originalBytes = createBytes(1n);
        const field = bytes32Simulator.fromBytes(originalBytes);
        const convertedBytes = bytes32Simulator.toBytes(field);
        expect(convertedBytes).toBeInstanceOf(Uint8Array);
        expect(convertedBytes.length).toBe(32);
      });

      test('should round-trip conversion work for maximum field value', () => {
        const maxField = 2n ** 254n - 1n;
        const bytes = bytes32Simulator.toBytes(maxField);
        const field = bytes32Simulator.fromBytes(bytes);
        expect(typeof field).toBe('bigint');
        expect(field).toBeGreaterThan(0n);
      });

      test('should handle small field values', () => {
        const smallField = 1n;
        const bytes = bytes32Simulator.toBytes(smallField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should handle medium field values', () => {
        const mediumField = 1000000n;
        const bytes = bytes32Simulator.toBytes(mediumField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should handle large field values', () => {
        const largeField = 2n ** 128n - 1n;
        const bytes = bytes32Simulator.toBytes(largeField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });

      test('should handle field values at field boundary', () => {
        const boundaryField = 2n ** 254n;
        const bytes = bytes32Simulator.toBytes(boundaryField);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(bytes.length).toBe(32);
      });
    });
  });
});
