import type { MeshOptions } from "./generateLithophaneMesh";
import type { ImageAdjustOptions, ImagePreprocessOptions } from "./imageToHeightMap";

export type Params = {
  sampleLongSide: number;
  physicalWidthMm: number;
  minThicknessMm: number;
  maxThicknessMm: number;
  contrast: number;
  gamma: number;
  invert: boolean;
};

export type ImageInfo = {
  imageWidth: number;
  imageHeight: number;
};

export type SetImageRequest = {
  type: "SET_IMAGE";
  imageRequestId: number;
  bitmap: ImageBitmap;
  preprocessOptions: ImagePreprocessOptions;
};

export type GeneratePreviewRequest = {
  type: "GENERATE_PREVIEW";
  requestId: number;
  imageRequestId: number;
  preprocessOptions: ImageAdjustOptions;
  meshOptions: MeshOptions;
};

export type Export3mfRequest = {
  type: "EXPORT_3MF";
  requestId: number;
  imageRequestId: number;
  preprocessOptions: ImageAdjustOptions;
  meshOptions: MeshOptions;
  exportOptions: {
    modelName: string;
    application: string;
    precision: number;
    compress: boolean;
  };
};

export type WorkerRequest =
  | SetImageRequest
  | GeneratePreviewRequest
  | Export3mfRequest;

export type ImageReadyResponse = {
  type: "IMAGE_READY";
  imageRequestId: number;
  imageWidth: number;
  imageHeight: number;
  pixelCount: number;
};

export type PreviewReadyResponse = {
  type: "PREVIEW_READY";
  requestId: number;
  imageRequestId: number;
  vertexCount: number;
  triangleCount: number;
  indexType: "uint16" | "uint32";
  positionsBuffer: ArrayBuffer;
  indicesBuffer: ArrayBuffer;
  tBuffer: ArrayBuffer;
};

export type Export3mfDoneResponse = {
  type: "EXPORT_3MF_DONE";
  requestId: number;
  imageRequestId: number;
  buffer: ArrayBuffer;
};

export type WorkerErrorResponse = {
  type: "ERROR";
  failedType: "image" | "preview" | "export";
  requestId?: number;
  imageRequestId?: number;
  message: string;
};

export type WorkerResponse =
  | ImageReadyResponse
  | PreviewReadyResponse
  | Export3mfDoneResponse
  | WorkerErrorResponse;
