// Unpacks a WOFF font into the TrueType file it was made from. The site's fonts are bundled as WOFF;
// a PDF can only embed TrueType. WOFF is TrueType with each table zlib-compressed, so this is just
// inflating the tables and writing the TrueType table directory, with the browser's own
// DecompressionStream. Nothing is fetched.

async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** The TrueType (or OpenType) bytes inside a WOFF file. Throws if it isn't one. */
export async function woffToSfnt(woff: Uint8Array): Promise<Uint8Array> {
  const dv = new DataView(woff.buffer, woff.byteOffset, woff.byteLength);
  if (woff.byteLength < 44 || dv.getUint32(0) !== 0x774f4646) throw new Error("Not a WOFF font");
  const flavor = dv.getUint32(4), count = dv.getUint16(12);
  const tables = await Promise.all(Array.from({ length: count }, async (_, i) => {
    const o = 44 + i * 20;
    const tag = dv.getUint32(o), offset = dv.getUint32(o + 4), compLength = dv.getUint32(o + 8), origLength = dv.getUint32(o + 12), checksum = dv.getUint32(o + 16);
    const raw = woff.subarray(offset, offset + compLength);
    // A table is stored as it is when compressing it wouldn't have made it smaller.
    const data = compLength < origLength ? await inflate(raw) : raw;
    if (data.byteLength !== origLength) throw new Error("A WOFF table didn't unpack to its stated length");
    return { tag, checksum, data };
  }));

  const padded = (n: number): number => (n + 3) & ~3;
  const out = new Uint8Array(12 + 16 * count + tables.reduce((n, t) => n + padded(t.data.byteLength), 0));
  const ov = new DataView(out.buffer);
  let log2 = 0;
  while (2 << log2 <= count) log2++;
  ov.setUint32(0, flavor);
  ov.setUint16(4, count);
  ov.setUint16(6, 16 << log2);
  ov.setUint16(8, log2);
  ov.setUint16(10, count * 16 - (16 << log2));
  let pos = 12 + 16 * count;
  tables.forEach((t, i) => {
    const o = 12 + 16 * i;
    ov.setUint32(o, t.tag);
    ov.setUint32(o + 4, t.checksum);
    ov.setUint32(o + 8, pos);
    ov.setUint32(o + 12, t.data.byteLength);
    out.set(t.data, pos);
    pos += padded(t.data.byteLength);
  });
  return out;
}
