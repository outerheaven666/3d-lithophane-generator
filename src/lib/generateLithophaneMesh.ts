import type { HeightMap } from "./imageToHeightMap";

export type MeshOptions = {
  physicalWidthMm: number;
  physicalHeightMm: number;
  minThicknessMm: number;
  maxThicknessMm: number;
};

export type MeshData = {
  positions: Float32Array;
  indices: Uint16Array | Uint32Array;
  indexType: "uint16" | "uint32";
  vertexCount: number;
  triangleCount: number;
};

export function generateLithophaneMesh(
  heightMap: HeightMap,
  options: MeshOptions
): MeshData {
  const { width, height, values } = heightMap;

  if (width < 2 || height < 2) {
    throw new Error("图片采样尺寸太小，至少需要 2 x 2 像素。");
  }

  if (values.length !== width * height) {
    throw new Error("高度图尺寸与像素数据长度不一致。");
  }

  const vertexCount = width * height * 2;
  const cellCount = (width - 1) * (height - 1);
  const triangleCount = cellCount * 4 + (width - 1) * 4 + (height - 1) * 4;
  const positions = new Float32Array(vertexCount * 3);
  const indexType = vertexCount > 65535 ? "uint32" : "uint16";
  const indices =
    indexType === "uint32"
      ? new Uint32Array(triangleCount * 3)
      : new Uint16Array(triangleCount * 3);

  writeVertices(heightMap, options, positions);
  writeFaces(width, height, indices);

  return {
    positions,
    indices,
    indexType,
    vertexCount,
    triangleCount,
  };
}

function writeVertices(
  heightMap: HeightMap,
  options: MeshOptions,
  positions: Float32Array
) {
  const { width, height, values } = heightMap;
  const minThickness = Math.max(0.05, options.minThicknessMm);
  const maxThickness = Math.max(minThickness + 0.05, options.maxThicknessMm);
  const thicknessRange = maxThickness - minThickness;
  const dx = options.physicalWidthMm / (width - 1);
  const dy = options.physicalHeightMm / (height - 1);
  const halfW = options.physicalWidthMm / 2;
  const halfH = options.physicalHeightMm / 2;
  const gridVertexCount = width * height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const gridIndex = y * width + x;
      const px = x * dx - halfW;
      const py = halfH - y * dy;
      const pz = minThickness + clamp01(values[gridIndex]) * thicknessRange;

      writePosition(positions, gridIndex, px, py, pz);
      writePosition(positions, gridVertexCount + gridIndex, px, py, 0);
    }
  }
}

function writeFaces(
  width: number,
  height: number,
  indices: Uint16Array | Uint32Array
) {
  const backOffset = width * height;
  let cursor = 0;

  const tri = (a: number, b: number, c: number) => {
    indices[cursor++] = a;
    indices[cursor++] = b;
    indices[cursor++] = c;
  };

  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const a = y * width + x;
      const b = a + 1;
      const c = a + width;
      const d = c + 1;

      tri(a, c, b);
      tri(b, c, d);

      tri(backOffset + a, backOffset + b, backOffset + c);
      tri(backOffset + b, backOffset + d, backOffset + c);
    }
  }

  for (let x = 0; x < width - 1; x++) {
    const topA = x;
    const topB = x + 1;
    const bottomA = (height - 1) * width + x;
    const bottomB = bottomA + 1;

    tri(topA, topB, backOffset + topA);
    tri(topB, backOffset + topB, backOffset + topA);

    tri(bottomA, backOffset + bottomA, bottomB);
    tri(bottomB, backOffset + bottomA, backOffset + bottomB);
  }

  for (let y = 0; y < height - 1; y++) {
    const leftTop = y * width;
    const leftBottom = leftTop + width;
    const rightTop = leftTop + width - 1;
    const rightBottom = leftBottom + width - 1;

    tri(leftTop, backOffset + leftTop, leftBottom);
    tri(leftBottom, backOffset + leftTop, backOffset + leftBottom);

    tri(rightTop, rightBottom, backOffset + rightTop);
    tri(rightBottom, backOffset + rightBottom, backOffset + rightTop);
  }
}

function writePosition(
  positions: Float32Array,
  vertexIndex: number,
  x: number,
  y: number,
  z: number
) {
  const base = vertexIndex * 3;
  positions[base] = x;
  positions[base + 1] = y;
  positions[base + 2] = z;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
