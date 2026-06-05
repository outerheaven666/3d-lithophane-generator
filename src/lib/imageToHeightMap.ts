export type ImagePreprocessOptions = {
  maxLongSide: number;
  lockAspect: boolean;
  alphaBackground: number;
};

export type ImageAdjustOptions = {
  contrast: number;
  gamma: number;
  invert: boolean;
};

export type BaseGrayImage = {
  width: number;
  height: number;
  baseGray: Float32Array;
};

export type HeightMap = {
  width: number;
  height: number;
  values: Float32Array;
};

export function fitDimensions(
  width: number,
  height: number,
  maxLongSide: number
): { width: number; height: number } {
  const safeMax = Math.max(2, Math.round(maxLongSide));
  const longSide = Math.max(width, height);
  const scale = longSide > safeMax ? safeMax / longSide : 1;

  return {
    width: Math.max(2, Math.round(width * scale)),
    height: Math.max(2, Math.round(height * scale)),
  };
}

export function applyImageAdjustments(
  baseGray: Float32Array,
  options: ImageAdjustOptions
): Float32Array {
  const out = new Float32Array(baseGray.length);
  const contrastFactor =
    options.contrast >= 0 ? 1 + options.contrast * 2.5 : 1 + options.contrast;
  const gamma = Math.max(0.1, options.gamma);

  for (let i = 0; i < baseGray.length; i++) {
    let value = clamp01((baseGray[i] - 0.5) * contrastFactor + 0.5);
    value = Math.pow(value, 1 / gamma);

    // Default lithophane behavior: dark pixels become thicker.
    out[i] = options.invert ? value : 1 - value;
  }

  return out;
}

export function toHeightMap(
  image: BaseGrayImage,
  options: ImageAdjustOptions
): HeightMap {
  return {
    width: image.width,
    height: image.height,
    values: applyImageAdjustments(image.baseGray, options),
  };
}

export function bitmapToBaseGray(
  bitmap: ImageBitmap,
  options: ImagePreprocessOptions
): BaseGrayImage {
  const size = fitDimensions(bitmap.width, bitmap.height, options.maxLongSide);
  const canvas = new OffscreenCanvas(size.width, size.height);
  const ctx = canvas.getContext("2d", {
    alpha: true,
    colorSpace: "srgb",
  });

  if (!ctx) {
    throw new Error("当前浏览器不支持 OffscreenCanvas 2D 渲染。");
  }

  const background = Math.round(clamp01(options.alphaBackground) * 255);
  ctx.fillStyle = `rgb(${background}, ${background}, ${background})`;
  ctx.fillRect(0, 0, size.width, size.height);
  ctx.drawImage(bitmap, 0, 0, size.width, size.height);

  const { data } = ctx.getImageData(0, 0, size.width, size.height);
  const baseGray = new Float32Array(size.width * size.height);

  for (let i = 0, p = 0; i < baseGray.length; i++, p += 4) {
    baseGray[i] =
      (0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2]) / 255;
  }

  return {
    width: size.width,
    height: size.height,
    baseGray,
  };
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
