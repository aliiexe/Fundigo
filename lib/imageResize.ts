import sharp from "sharp";

/** Max dimension (width or height) for receipt/document images sent to AI. Keeps payload small and processing fast. */
const MAX_SIZE = 1200;
const JPEG_QUALITY = 85;

/**
 * Resize and compress an image buffer for fast AI processing. Returns base64 JPEG.
 * Reduces upload/API time and avoids timeouts on large phone photos.
 */
export async function resizeForReceipt(buffer: Buffer): Promise<string> {
  const image = sharp(buffer);
  const meta = await image.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  const needsResize = w > MAX_SIZE || h > MAX_SIZE;
  const alreadyJpeg = meta.format === "jpeg" || meta.format === "jpg";
  if (!needsResize && alreadyJpeg) {
    return buffer.toString("base64");
  }
  const resized = await image
    .resize(MAX_SIZE, MAX_SIZE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
  return resized.toString("base64");
}
