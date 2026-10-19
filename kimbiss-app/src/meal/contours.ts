/** Width of the copy the edges are found on: fine enough for a slice's crust, quick on the main thread. */
const GRID_WIDTH = 240;
/** The share of the sharpest places that reach full strength. */
const KEPT_SHARE = 0.08;
/** Below this gradient a place is never an edge, however flat the photo. */
const MINIMUM_GRADIENT = 60;

/**
 * The outlines on a meal photo for the analysing animation to light up, as a
 * white PNG data URL whose alpha is the edge strength, and its aspect ratio.
 * Drawing the shown image applies the same EXIF rotation the img element does.
 */
export function findOutlines(image: HTMLImageElement): { url: string; ratio: number } {
  const width = GRID_WIDTH;
  const height = Math.max(3, Math.round(image.naturalHeight * width / image.naturalWidth));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, 0, 0, width, height);
  const alphas = contourAlphas(width, height, context.getImageData(0, 0, width, height).data);
  const outlines = context.createImageData(width, height);
  alphas.forEach((alpha, index) => outlines.data.set([255, 255, 255, Math.round(alpha * 255)], index * 4));
  context.putImageData(outlines, 0, 0);
  return { url: canvas.toDataURL(), ratio: width / height };
}

/**
 * Insulink's FoodContours: a Sobel filter on the greyscale picture gives every
 * pixel an edge strength from 0 (flat) to 1 (a sharp edge). The values ramp
 * softly instead of cutting at a threshold, so the outlines read as lines, not
 * dots. Strength is measured against the sharpest three percent and lifted by a
 * power of 0.7, so a white plate rim does not leave the food's own crust pale.
 */
export function contourAlphas(width: number, height: number, rgba: ArrayLike<number>): Float32Array {
  const grey = new Float64Array(width * height);
  for (let pixel = 0; pixel < grey.length; pixel++) {
    grey[pixel] = 0.299 * rgba[pixel * 4] + 0.587 * rgba[pixel * 4 + 1] + 0.114 * rgba[pixel * 4 + 2];
  }
  const at = (column: number, row: number) => grey[row * width + column];
  const gradients = new Float64Array(width * height);
  for (let row = 1; row < height - 1; row++) {
    for (let column = 1; column < width - 1; column++) {
      const horizontal = at(column + 1, row - 1) + 2 * at(column + 1, row) + at(column + 1, row + 1)
        - at(column - 1, row - 1) - 2 * at(column - 1, row) - at(column - 1, row + 1);
      const vertical = at(column - 1, row + 1) + 2 * at(column, row + 1) + at(column + 1, row + 1)
        - at(column - 1, row - 1) - 2 * at(column, row - 1) - at(column + 1, row - 1);
      gradients[row * width + column] = Math.hypot(horizontal, vertical);
    }
  }
  const sorted = gradients.slice().sort();
  const percentile = (share: number) => sorted[Math.round(share * (sorted.length - 1))];
  const edge = Math.max(percentile(1 - KEPT_SHARE), MINIMUM_GRADIENT);
  const sharp = Math.max(percentile(0.97), edge + 1);
  const floor = edge * 0.6;
  return Float32Array.from(gradients, (gradient) =>
    Math.min(1, Math.max(0, (gradient - floor) / (sharp - floor))) ** 0.7);
}
