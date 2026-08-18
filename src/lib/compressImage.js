// Downscale + re-encode images before upload so phone photos (often 5-10MB)
// become small WebP/JPEGs — dramatically faster uploads and faster loads later.
export async function compressImage(file, maxWidth = 1280, quality = 0.82) {
  if (!file.type.startsWith("image/")) return file;
  if (file.type === "image/gif") return file; // don't break animations
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxWidth / img.width);
      if (scale >= 1 && file.size < 400 * 1024) { resolve(file); return; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}