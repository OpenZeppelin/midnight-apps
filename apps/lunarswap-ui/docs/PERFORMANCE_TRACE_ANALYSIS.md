# Performance trace analysis (Trace-20260227T103817.json)

Summary of findings from the Chrome DevTools performance trace to explain the "long freeze" when connecting to the contract.

## Main finding: ~7.4 s main-thread block from WASM

The trace shows **two** main-thread blocks of **~7.4–7.5 seconds** each. Both follow the same pattern:

1. **Trigger**: An **IndexedDB `transaction.oncomplete`** callback runs (in the app bundle `App-B_-drQ25.js`, line 104851 in the built file).
2. **What runs next**: **RunMicrotasks** runs for **7,445,375 µs (~7.45 s)** in one go.
3. **What’s inside**: The CPU profile in the trace shows **WASM** from **`midnight_onchain_runtime_wasm_bg-*.wasm`** (e.g. `wasm-function[1723]`, `wasm-function[956]`, `wasm-function[2448]`). So the freeze is **Midnight onchain runtime WASM** executing on the main thread.
4. **Frame timing**: `AnimationFrame` reports **blocking_duration_ms: 7397** for that frame.

So the sequence is:

- Contract join runs → uses **levelPrivateStateProvider** (IndexedDB/LevelDB).
- A **transaction** completes → **transaction.oncomplete** fires.
- That triggers a promise/microtask chain that runs **Midnight WASM** for ~7.4 s **on the main thread**, so the tab freezes.

## Other notable events

| Duration | Event | Notes |
|----------|--------|------|
| ~598 ms | RunTask + FunctionCall `"gd"` (index-*.js) | Initial load / bootstrap (minified name). |
| ~131 ms | **FireIdleCallback** → **runInit** (App-*.js) | Our deferred `initializeLunarswap`; cost is small. |
| ~296 ms | **v8.compileModule** (App-B_-drQ25.js) | First-time module compile; one-off. |
| ~7.45 s | RunTask → RunMicrotasks | **Main culprit**: WASM after transaction.oncomplete. |

## Root cause

The long freeze is **not** from:

- Our `requestIdleCallback` / `initializeLunarswap` scheduling.
- React or general JS in our app code.

It **is** from:

- **Private state** (LevelDB/IndexedDB) finishing a transaction, then
- A **synchronous** run of **Midnight onchain runtime WASM** (~7.4 s) on the main thread inside the resulting microtask chain.

So the bottleneck is inside the **Midnight SDK / midnight-js** stack (contract join + private state + WASM), not in the lunarswap-ui app logic.

## Recommendations

1. **Upstream (Midnight SDK / midnight-js)**  
   - Run the WASM-heavy path (onchain runtime) **off the main thread** (e.g. Web Worker) so that:
     - `transaction.oncomplete` (or the code that runs after it) does not trigger ~7.4 s of main-thread WASM.
   - Alternatively, chunk the WASM work and yield to the main thread periodically so the UI can stay responsive.

2. **In this app**  
   - We already defer contract join with `requestIdleCallback` and show a “Connecting…” state. That improves perceived load but cannot remove a 7.4 s main-thread block once the join runs.
   - Further improvement would require the SDK to support running the contract-join / WASM phase in a worker or in a non-blocking way.

3. **Profiling again**  
   - To confirm after SDK changes: take a new trace, look for **RunMicrotasks** or **RunTask** with duration > 1 s on the **CrRendererMain** thread, then inspect the **Bottom-Up** tab for `midnight_onchain_runtime_wasm_bg` and `transaction.oncomplete`.

## Trace metadata

- **File**: `Trace-20260227T103817.json`
- **Start**: 2026-02-27T09:38:17.330Z
- **Page**: `http://localhost:8080/lunarswap/pool`
- **Renderer PID**: 1074, main thread **tid 759** (CrRendererMain)
