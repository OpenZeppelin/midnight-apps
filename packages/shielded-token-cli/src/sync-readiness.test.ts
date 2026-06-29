// SPDX-License-Identifier: MIT

import { describe, expect, it, vi } from "vitest";
import {
	DEFAULT_SYNC_MAX_GAP,
	isReadyToTransact,
	parseSyncMaxGap,
	type ReadinessState,
} from "./sync-readiness.js";

/** Build a sub-wallet progress whose isCompleteWithin returns `ready`. */
const prog = (ready: boolean) => ({ isCompleteWithin: () => ready });

/** Assemble a ReadinessState from per-wallet readiness flags. */
const state = (s: boolean, d: boolean, u: boolean): ReadinessState => ({
	shielded: { state: { progress: prog(s) } },
	dust: { state: { progress: prog(d) } },
	unshielded: { progress: prog(u) },
});

describe("parseSyncMaxGap", () => {
	it("defaults to 50 when unset or empty", () => {
		expect(parseSyncMaxGap(undefined)).toBe(DEFAULT_SYNC_MAX_GAP);
		expect(parseSyncMaxGap("")).toBe(50n);
	});

	it("parses non-negative integers (including 0)", () => {
		expect(parseSyncMaxGap("0")).toBe(0n);
		expect(parseSyncMaxGap("1")).toBe(1n);
		expect(parseSyncMaxGap("5000")).toBe(5000n);
	});

	it("rejects negatives, non-integers and garbage", () => {
		expect(() => parseSyncMaxGap("-1")).toThrow(/WALLET_SYNC_MAX_GAP/);
		expect(() => parseSyncMaxGap("1.5")).toThrow(/non-negative integer/);
		expect(() => parseSyncMaxGap("abc")).toThrow();
		expect(() => parseSyncMaxGap("12x")).toThrow();
	});
});

describe("isReadyToTransact", () => {
	it("is true only when all three sub-wallets are within the gap", () => {
		expect(isReadyToTransact(state(true, true, true), 50n)).toBe(true);
	});

	it("is false when any single sub-wallet lags", () => {
		expect(isReadyToTransact(state(false, true, true), 50n)).toBe(false);
		expect(isReadyToTransact(state(true, false, true), 50n)).toBe(false);
		expect(isReadyToTransact(state(true, true, false), 50n)).toBe(false);
	});

	it("is false (not throwing) when a progress object or method is missing", () => {
		expect(isReadyToTransact({}, 50n)).toBe(false);
		expect(
			isReadyToTransact(
				{
					shielded: { state: { progress: prog(true) } },
					dust: { state: { progress: prog(true) } },
					unshielded: { progress: {} }, // no isCompleteWithin
				},
				50n,
			),
		).toBe(false);
	});

	it("passes the configured maxGap through to each sub-wallet check", () => {
		const shielded = vi.fn().mockReturnValue(true);
		const dust = vi.fn().mockReturnValue(true);
		const unshielded = vi.fn().mockReturnValue(true);
		const s: ReadinessState = {
			shielded: { state: { progress: { isCompleteWithin: shielded } } },
			dust: { state: { progress: { isCompleteWithin: dust } } },
			unshielded: { progress: { isCompleteWithin: unshielded } },
		};
		expect(isReadyToTransact(s, 123n)).toBe(true);
		expect(shielded).toHaveBeenCalledWith(123n);
		expect(dust).toHaveBeenCalledWith(123n);
		expect(unshielded).toHaveBeenCalledWith(123n);
	});

	it("short-circuits: strict gap 0 still works when exactly at tip", () => {
		const atTip = { isCompleteWithin: (g: bigint) => g >= 0n };
		const s: ReadinessState = {
			shielded: { state: { progress: atTip } },
			dust: { state: { progress: atTip } },
			unshielded: { progress: atTip },
		};
		expect(isReadyToTransact(s, 0n)).toBe(true);
	});
});
