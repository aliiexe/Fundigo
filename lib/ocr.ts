const OCR_TIMEOUT_MS = 15_000;

/**
 * Extract raw text from an image buffer using Tesseract OCR.
 * In Next.js, Tesseract's worker can fail to load (MODULE_NOT_FOUND); we return "" and the API falls back to vision.
 */
export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  let createWorker: typeof import("tesseract.js").createWorker;
  try {
    const tesseract = await import("tesseract.js");
    createWorker = tesseract.createWorker;
  } catch (e) {
    console.warn("[OCR] Tesseract not available:", (e as Error).message);
    return "";
  }

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("OCR_TIMEOUT")), OCR_TIMEOUT_MS)
  );

  const workerPromise = (async () => {
    const worker = await createWorker("eng");
    try {
      const { data } = await worker.recognize(buffer);
      return (data.text || "").trim();
    } finally {
      await worker.terminate();
    }
  })();

  try {
    return await Promise.race([workerPromise, timeoutPromise]);
  } catch (e) {
    if (e instanceof Error && e.message === "OCR_TIMEOUT") {
      console.warn("[OCR] Timed out");
      return "";
    }
    if (e instanceof Error && (e as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") {
      console.warn("[OCR] Worker module not found (Next.js); falling back to vision.");
      return "";
    }
    console.warn("[OCR] Failed:", (e as Error).message);
    return "";
  }
}
