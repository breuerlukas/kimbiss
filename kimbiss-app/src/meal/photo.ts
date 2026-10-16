const LONG_EDGE = 1280;
const QUALITY = 0.8;

/**
 * Shrinks a camera photo to a base64 JPEG of at most 1280 px on the long edge,
 * a few hundred kB, well under the api's 2 MB cap. Decoding through
 * createImageBitmap also turns an iPhone HEIC into pixels and applies the
 * EXIF rotation.
 */
export async function photoToJpegBase64(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return dataUrl.slice(dataUrl.indexOf(",") + 1);
}
