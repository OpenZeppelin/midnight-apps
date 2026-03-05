# `sendRequest` accepts HTML as valid binary and `getKeyMaterial` silently discards errors — proof failures become undiagnosable

While integrating with `@midnight-ntwrk/midnight-js-http-client-proof-provider` and `@midnight-ntwrk/midnight-js-fetch-zk-config-provider`, we ran into two issues in the proving pipeline that make proof failures very difficult to diagnose. In both cases the root cause is invisible at the layer where it occurs, and the only error surfaces later at the proof server with no useful context.

```
proveTx → getKeyMaterial → zkConfigProvider.get(circuitId)
            ├── sendRequest("keys", circuitId, ".prover")   → GET {origin}/keys/{circuitId}.prover
            ├── sendRequest("keys", circuitId, ".verifier")  → GET {origin}/keys/{circuitId}.verifier
            └── sendRequest("zkir", circuitId, ".bzkir")     → GET {origin}/zkir/{circuitId}.bzkir
          → createProvingPayload(preimage, keyMaterial)
          → POST {proofServerUrl}/prove
```

---

### Issue 1 — `FetchZkConfigProvider.sendRequest` accepts any 200 response as valid binary, including HTML fallback pages

**Location:** `FetchZkConfigProvider.sendRequest()` in `midnight-js-fetch-zk-config-provider`

**What we observed:**

The current implementation only checks `response.ok` before treating the response
body as binary key material:

```js
// Only checks HTTP status code
if (response.ok) {
  return new Uint8Array(await response.arrayBuffer());
}
throw new Error(response.statusText);
```

There is no inspection of the response body or `Content-Type` header.

The SDK fetches Midnight protocol circuit artifacts (prover keys, verifier keys, ZKIR bytecode) via HTTP GET from the configured `baseURL`. These artifacts are compiled by the Midnight protocol toolchain and typically live on the proof server or a dedicated artifact server — not inside the dApp itself. However, when the `baseURL` points to the app's own origin (e.g. `window.location.origin`), these requests go to the app's dev server, which does not have the circuit files.

The problem is that the app's server does not return a 404 for the missing files. Instead, SPA dev servers (Vite, webpack-dev-server, etc.) have a catch-all fallback that serves `index.html` with a `200 OK` for any route that does not match a static file — this is how client-side routing works. So the SDK receives HTML in place of binary circuit data, and `sendRequest` accepts it because the status code is 200:

```
GET /keys/{circuitId}.prover
    → circuit artifact does not exist on the app server
    → SPA fallback returns index.html with 200 OK
    → sendRequest sees response.ok === true
    → returns HTML bytes as a "valid" ProverKey
```

`createProverKey(htmlBytes)` wraps the HTML in a branded `ProverKey` type with no further validation. The pipeline continues — the HTML bytes are packed into the proving payload and sent to the proof server:

```
POST /prove
Body (first 80 bytes, utf8): "<!DOCTYPE html><html lang=\"en\"><head><meta charset=\"UTF-8\" ..."

→ proof server cannot parse this as a valid proving payload
→ returns HTTP 500 with no mention of the HTML or the circuit name
```

**What we would suggest:**

1. **Check `Content-Type` before accepting a binary response** — reject `text/html`:

   ```js
   var ct = (response.headers.get('content-type') || '').toLowerCase();
   if (responseType === 'arraybuffer' && ct.includes('text/html')) {
     throw new Error('Expected binary ZK artifact at ' + fullUrl + ', got text/html (possible SPA fallback)');
   }
   ```

2. **Validate ZKIR magic bytes** — detect corrupted `.bzkir` files at download time:

   ```js
   if (ext === '.bzkir' && bytes.length > 20) {
     var header = new TextDecoder().decode(bytes.subarray(0, 20));
     if (!header.startsWith('midnight:ir-source')) {
       throw new Error('Invalid ZKIR data at ' + fullUrl + ': expected midnight:ir-source header, got: ' + JSON.stringify(header));
     }
   }
   ```

3. **Include the full URL in errors** — so the failing artifact is immediately visible in logs rather than just the HTTP status text.

---

### Issue 2 — `getKeyMaterial` silently swallows all errors and returns `undefined`, hiding which circuit's key material failed to load

**Location:** `getKeyMaterial()` in `midnight-js-http-client-proof-provider`

**What we observed:**

The current implementation wraps the entire artifact retrieval and conversion in a
try/catch that discards any error:

```js
const getKeyMaterial = async (zkConfigProvider, keyLocation) => {
  try {
    const zkConfig = await zkConfigProvider.get(keyLocation);
    return zkConfigToProvingKeyMaterial(zkConfig);
  }
  catch {
    return undefined;  // ← swallows the error entirely
  }
};
```

If `zkConfigProvider.get()` throws for any reason — a network error, a 404, an invalid response body, or `zkConfigToProvingKeyMaterial` failing on malformed bytes — the error is silently discarded and `undefined` is returned without any log.

That `undefined` is then passed directly into `createProvingPayload`:

```js
const payload = createProvingPayload(serializedPreimage, overwriteBindingInput, keyMaterial);
//                                                                               ^^^^^^^^^^
//                                                                               undefined here
```

The payload is built and sent to the proof server regardless. The proof server then fails and returns an error that contains no information about which circuit's key material was missing or why. From the developer's perspective the only visible symptom is a proof server error at `/prove`, with no indication of where in the artifact fetching chain things went wrong.

**What we would suggest:**

Returning `undefined` may be intentional (the proof server might already have the key material cached), so the control flow itself may be fine. The problem is just that the failure is completely invisible. A warning log before returning `undefined` would preserve the existing behaviour while making it diagnosable:

```js
catch (err) {
    console.warn('[getKeyMaterial] could not load key material for "' + keyLocation + '":', err?.message || err);
    return undefined;
}
```

---

### Combined Effect

The two issues compound each other. Issue 1 means an artifact fetch can appear to succeed while carrying HTML garbage. Issue 2 means that even if the fetch does throw, the error is discarded before it can surface anywhere useful.

In both cases the proof server is the first component to return an error, but by that point all context about the root cause is gone. What we experienced was long proof-generation timeouts followed by opaque 500 responses, with nothing in the logs pointing to which circuit's key material was the problem or what the actual fetch had returned.

Fixing either layer to fail loudly and explicitly — with the circuit ID and the requested URL in the error message — would make this class of failure trivial to diagnose.
