import { exportMeshTo3mf } from "../lib/export3mf";
import { generateLithophaneMesh } from "../lib/generateLithophaneMesh";
import {
  bitmapToBaseGray,
  toHeightMap,
  type BaseGrayImage,
} from "../lib/imageToHeightMap";
import type { WorkerRequest, WorkerResponse } from "../lib/messages";

type WorkerScope = typeof self & {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
  postMessage: (message: WorkerResponse, transfer?: Transferable[]) => void;
};

const workerScope = self as unknown as WorkerScope;

let latestImageRequestId = 0;
let cachedImageRequestId = 0;
let cachedImage: BaseGrayImage | null = null;

workerScope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  try {
    if (msg.type === "SET_IMAGE") {
      handleSetImage(msg);
      return;
    }

    if (msg.type === "GENERATE_PREVIEW") {
      handleGeneratePreview(msg);
      return;
    }

    handleExport3mf(msg);
  } catch (error) {
    post({
      type: "ERROR",
      failedType:
        msg.type === "EXPORT_3MF"
          ? "export"
          : msg.type === "GENERATE_PREVIEW"
            ? "preview"
            : "image",
      requestId: "requestId" in msg ? msg.requestId : undefined,
      imageRequestId: "imageRequestId" in msg ? msg.imageRequestId : undefined,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

function handleSetImage(msg: Extract<WorkerRequest, { type: "SET_IMAGE" }>) {
  latestImageRequestId = Math.max(latestImageRequestId, msg.imageRequestId);

  if (msg.imageRequestId < latestImageRequestId) {
    msg.bitmap.close();
    return;
  }

  const image = bitmapToBaseGray(msg.bitmap, msg.preprocessOptions);
  msg.bitmap.close();

  if (msg.imageRequestId < latestImageRequestId) {
    return;
  }

  cachedImage = image;
  cachedImageRequestId = msg.imageRequestId;

  post({
    type: "IMAGE_READY",
    imageRequestId: msg.imageRequestId,
    imageWidth: image.width,
    imageHeight: image.height,
    pixelCount: image.width * image.height,
  });
}

function handleGeneratePreview(
  msg: Extract<WorkerRequest, { type: "GENERATE_PREVIEW" }>
) {
  const image = assertCurrentImage(msg.imageRequestId);
  const heightMap = toHeightMap(image, msg.preprocessOptions);
  const mesh = generateLithophaneMesh(heightMap, msg.meshOptions);

  post(
    {
      type: "PREVIEW_READY",
      requestId: msg.requestId,
      imageRequestId: msg.imageRequestId,
      vertexCount: mesh.vertexCount,
      triangleCount: mesh.triangleCount,
      indexType: mesh.indexType,
      positionsBuffer: asArrayBuffer(mesh.positions.buffer),
      indicesBuffer: asArrayBuffer(mesh.indices.buffer),
      tBuffer: asArrayBuffer(heightMap.values.buffer),
    },
    [
      asArrayBuffer(mesh.positions.buffer),
      asArrayBuffer(mesh.indices.buffer),
      asArrayBuffer(heightMap.values.buffer),
    ]
  );
}

function handleExport3mf(msg: Extract<WorkerRequest, { type: "EXPORT_3MF" }>) {
  const image = assertCurrentImage(msg.imageRequestId);
  const heightMap = toHeightMap(image, msg.preprocessOptions);
  const mesh = generateLithophaneMesh(heightMap, msg.meshOptions);
  const archive = exportMeshTo3mf(mesh, msg.exportOptions);

  post(
    {
      type: "EXPORT_3MF_DONE",
      requestId: msg.requestId,
      imageRequestId: msg.imageRequestId,
      buffer: asArrayBuffer(archive.buffer),
    },
    [asArrayBuffer(archive.buffer)]
  );
}

function assertCurrentImage(imageRequestId: number): BaseGrayImage {
  if (!cachedImage || cachedImageRequestId !== imageRequestId) {
    throw new Error("图片缓存已过期，请等待最新图片处理完成。");
  }

  return cachedImage;
}

function post(message: WorkerResponse, transfer?: Transferable[]) {
  workerScope.postMessage(message, transfer ?? []);
}

function asArrayBuffer(buffer: ArrayBufferLike): ArrayBuffer {
  return buffer as ArrayBuffer;
}
