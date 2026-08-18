// Downscale + re-encode images before upload so phone photos (often 5-10MB)
// become small WebPs — dramatically faster uploads and faster loads later.
// WebP keeps better quality than JPEG at the same (or smaller) file size.
export async function compressImage(file, maxWidth = 1600, quality = 0.85) {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file; // don't break animations
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      // Already small enough and within max width — upload as-is.
      if (scale >= 1 && file.size < 350 * 1024) { resolve(file); return; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Prefer WebP (much smaller at same quality); fall back to JPEG if unsupported.
      const tryWebp = () =>
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }));
            } else {
              tryJpeg();
            }
          },
          "image/webp",
          quality
        );
      const tryJpeg = () =>
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) { resolve(file); return; }
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      tryWebp();
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}