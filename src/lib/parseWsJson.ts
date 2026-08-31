/**
 * Decode a WebSocket MessageEvent payload to text, then JSON-parse it.
 *
 * Mirrors CFD `supportTicketWs.ts`: customer-backend used to forward UC text
 * frames as BINARY Blobs (`send(Buffer)` default). After CB `39e233e` frames
 * should arrive as text again, but we still accept Blob/ArrayBuffer so a
 * mis-relay never silently drops discover/ingest progress.
 */
export async function readWsText(data: unknown): Promise<string | null> {
  if (typeof data === "string") return data;
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    if (typeof data.text === "function") return data.text();
    // jsdom Blobs may lack .text() — fall back to arrayBuffer/FileReader.
    if (typeof data.arrayBuffer === "function") {
      return new TextDecoder().decode(await data.arrayBuffer());
    }
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsText(data);
    });
  }
  if (ArrayBuffer.isView(data)) {
    const view = data as ArrayBufferView;
    return new TextDecoder().decode(
      view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength),
    );
  }
  // Prefer isView above; plain ArrayBuffer (and cross-realm buffers) via toString tag.
  if (
    data instanceof ArrayBuffer ||
    Object.prototype.toString.call(data) === "[object ArrayBuffer]"
  ) {
    return new TextDecoder().decode(data as ArrayBuffer);
  }
  return null;
}

export async function parseWsJson<T = unknown>(data: unknown): Promise<T | null> {
  const text = await readWsText(data);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
