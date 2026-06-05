import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Box,
  CheckCircle2,
  Download,
  FileDown,
  Gauge,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Maximize2,
  RefreshCcw,
  Ruler,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  LithophaneViewer,
  type LithophaneViewerHandle,
} from "./LithophaneViewer";
import type {
  ImageInfo,
  Params,
  PreviewReadyResponse,
  WorkerResponse,
} from "./lib/messages";

type Language = "zh" | "en";

type PreviewSnapshot = {
  previewId: number;
  imageRequestId: number;
  params: Params;
  imageInfo: ImageInfo;
};

type PreviewStats = {
  vertexCount: number;
  triangleCount: number;
} | null;

type StatusTone = "idle" | "busy" | "ready" | "error";

type StatusKey =
  | "selectImage"
  | "imageProcessed"
  | "modelGenerated"
  | "previewUpdated"
  | "exportFailed"
  | "previewFailed"
  | "imageFailed"
  | "unsupportedFile"
  | "sampleFailed"
  | "readingImage"
  | "imageReadFailed"
  | "waitingResample"
  | "resampling"
  | "generatingPreview"
  | "sizeUpdated"
  | "previewRequired"
  | "generating3mf";

type StatusMessage = {
  key: StatusKey;
  tone: StatusTone;
  values?: Record<string, number | string>;
};

type Copy = {
  appTitle: string;
  brand: string;
  languageLabel: string;
  zhLabel: string;
  enLabel: string;
  resetParams: string;
  input: string;
  uploadImage: string;
  fileTypes: string;
  sampleImage: string;
  size: string;
  widthPresetLabel: string;
  sampleLongSide: string;
  modelWidth: string;
  modelHeight: string;
  minThickness: string;
  maxThickness: string;
  image: string;
  contrast: string;
  gamma: string;
  invert: string;
  output: string;
  sourceImage: string;
  model: string;
  thickness: string;
  mesh: string;
  faces: string;
  vertices: string;
  download3mf: string;
  generating: string;
  preview3d: string;
  fitView: string;
  waitingImage: string;
  workflow: {
    exporting: string;
    generating: string;
    downloadable: string;
    loaded: string;
    waiting: string;
  };
  status: Record<StatusKey, (values?: Record<string, number | string>) => string>;
  sampleFileName: string;
};

const COPY: Record<Language, Copy> = {
  zh: {
    appTitle: "照片光雕生成器",
    brand: "Lithophane Studio",
    languageLabel: "语言",
    zhLabel: "中文",
    enLabel: "EN",
    resetParams: "重置参数",
    input: "输入",
    uploadImage: "上传图片",
    fileTypes: "JPG / PNG / WEBP",
    sampleImage: "示例图",
    size: "尺寸",
    widthPresetLabel: "模型宽度预设",
    sampleLongSide: "采样长边",
    modelWidth: "模型宽度",
    modelHeight: "模型高度",
    minThickness: "最小厚度",
    maxThickness: "最大厚度",
    image: "图像",
    contrast: "对比度",
    gamma: "Gamma",
    invert: "反相",
    output: "输出",
    sourceImage: "图片",
    model: "模型",
    thickness: "厚度",
    mesh: "网格",
    faces: "面",
    vertices: "顶点",
    download3mf: "下载 3MF",
    generating: "生成中",
    preview3d: "3D 预览",
    fitView: "适配视图",
    waitingImage: "等待图片",
    workflow: {
      exporting: "导出中",
      generating: "生成中",
      downloadable: "可下载",
      loaded: "已载入",
      waiting: "待上传",
    },
    status: {
      selectImage: () => "请选择图片",
      imageProcessed: (values) =>
        `图片已处理：${values?.width} x ${values?.height}px`,
      modelGenerated: () => "3MF 已生成",
      previewUpdated: () => "预览已更新",
      exportFailed: (values) => `导出失败：${values?.message}`,
      previewFailed: (values) => `预览失败：${values?.message}`,
      imageFailed: (values) => `图片处理失败：${values?.message}`,
      unsupportedFile: () => "请选择 JPG / PNG / WEBP 图片",
      sampleFailed: (values) => `示例图生成失败：${values?.message}`,
      readingImage: () => "正在读取图片",
      imageReadFailed: (values) => `图片读取失败：${values?.message}`,
      waitingResample: () => "等待重新采样",
      resampling: () => "正在重新采样",
      generatingPreview: () => "正在生成预览",
      sizeUpdated: () => "尺寸已更新",
      previewRequired: () => "请先生成预览",
      generating3mf: () => "正在生成 3MF",
    },
    sampleFileName: "光雕示例.png",
  },
  en: {
    appTitle: "Photo Lithophane Generator",
    brand: "Lithophane Studio",
    languageLabel: "Language",
    zhLabel: "中文",
    enLabel: "EN",
    resetParams: "Reset parameters",
    input: "Input",
    uploadImage: "Upload image",
    fileTypes: "JPG / PNG / WEBP",
    sampleImage: "Sample",
    size: "Size",
    widthPresetLabel: "Model width presets",
    sampleLongSide: "Sample long side",
    modelWidth: "Model width",
    modelHeight: "Model height",
    minThickness: "Min thickness",
    maxThickness: "Max thickness",
    image: "Image",
    contrast: "Contrast",
    gamma: "Gamma",
    invert: "Invert",
    output: "Output",
    sourceImage: "Image",
    model: "Model",
    thickness: "Thickness",
    mesh: "Mesh",
    faces: "faces",
    vertices: "vertices",
    download3mf: "Download 3MF",
    generating: "Generating",
    preview3d: "3D Preview",
    fitView: "Fit view",
    waitingImage: "Waiting for image",
    workflow: {
      exporting: "Exporting",
      generating: "Generating",
      downloadable: "Ready",
      loaded: "Loaded",
      waiting: "Waiting",
    },
    status: {
      selectImage: () => "Choose an image",
      imageProcessed: (values) =>
        `Image processed: ${values?.width} x ${values?.height}px`,
      modelGenerated: () => "3MF generated",
      previewUpdated: () => "Preview updated",
      exportFailed: (values) => `Export failed: ${values?.message}`,
      previewFailed: (values) => `Preview failed: ${values?.message}`,
      imageFailed: (values) => `Image processing failed: ${values?.message}`,
      unsupportedFile: () => "Choose a JPG, PNG, or WEBP image",
      sampleFailed: (values) => `Sample image failed: ${values?.message}`,
      readingImage: () => "Reading image",
      imageReadFailed: (values) => `Image read failed: ${values?.message}`,
      waitingResample: () => "Waiting to resample",
      resampling: () => "Resampling",
      generatingPreview: () => "Generating preview",
      sizeUpdated: () => "Size updated",
      previewRequired: () => "Generate a preview first",
      generating3mf: () => "Generating 3MF",
    },
    sampleFileName: "lithophane-sample.png",
  },
};

const DEFAULT_PARAMS: Params = {
  sampleLongSide: 500,
  physicalWidthMm: 100,
  minThicknessMm: 0.8,
  maxThicknessMm: 3.2,
  contrast: 0,
  gamma: 1,
  invert: false,
};

const SIZE_PRESETS = [
  { label: "80", value: 80 },
  { label: "100", value: 100 },
  { label: "140", value: 140 },
];

function sameHeightMapParams(a: Params, b: Params): boolean {
  return (
    a.sampleLongSide === b.sampleLongSide &&
    a.contrast === b.contrast &&
    a.gamma === b.gamma &&
    a.invert === b.invert
  );
}

function sanitizeParams(input: Params): Params {
  const next: Params = {
    sampleLongSide: clamp(Math.round(input.sampleLongSide), 200, 700),
    physicalWidthMm: clamp(input.physicalWidthMm, 40, 180),
    minThicknessMm: clamp(roundTo(input.minThicknessMm, 0.1), 0.6, 2),
    maxThicknessMm: clamp(roundTo(input.maxThicknessMm, 0.1), 2, 6),
    contrast: clamp(roundTo(input.contrast, 0.05), -1, 1),
    gamma: clamp(roundTo(input.gamma, 0.05), 0.4, 2.5),
    invert: input.invert,
  };

  if (next.minThicknessMm >= next.maxThicknessMm) {
    next.maxThicknessMm = roundTo(next.minThicknessMm + 0.1, 0.1);
  }

  return next;
}

export default function App() {
  const viewerRef = useRef<LithophaneViewerHandle | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const sourceFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sourcePreviewUrlRef = useRef<string | null>(null);

  const imageSeqRef = useRef(0);
  const latestImageIdRef = useRef(0);
  const previewSeqRef = useRef(0);
  const latestPreviewIdRef = useRef(0);
  const exportSeqRef = useRef(0);
  const latestExportIdRef = useRef(0);

  const pendingPreviewIdsRef = useRef<Set<number>>(new Set());
  const lastPreviewSnapshotRef = useRef<PreviewSnapshot | null>(null);
  const lastPositionsRef = useRef<Float32Array | null>(null);
  const lastTBufferRef = useRef<Float32Array | null>(null);
  const imageInfoRef = useRef<ImageInfo | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const resolutionDebounceTimerRef = useRef<number | null>(null);

  const [language, setLanguage] = useState<Language>(getInitialLanguage);
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sourceSize, setSourceSize] = useState(0);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [previewStats, setPreviewStats] = useState<PreviewStats>(null);
  const [status, setStatus] = useState<StatusMessage>({
    key: "selectImage",
    tone: "idle",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const [isPreviewPending, setIsPreviewPending] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasExportablePreview, setHasExportablePreview] = useState(false);

  const copy = COPY[language];
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = copy.appTitle;
    try {
      window.localStorage.setItem("lithophane-language", language);
    } catch {
      // Language still works for the current session if persistence is blocked.
    }
  }, [copy.appTitle, language]);

  useEffect(() => {
    return () => {
      revokeSourcePreviewUrl();
    };
  }, []);

  const physicalHeightMm = useMemo(() => {
    if (!imageInfo) return 0;
    return params.physicalWidthMm * (imageInfo.imageHeight / imageInfo.imageWidth);
  }, [params.physicalWidthMm, imageInfo]);

  const sizeSummary = imageInfo
    ? `${formatNumber(params.physicalWidthMm, 0)} x ${formatNumber(
        physicalHeightMm,
        1
      )} mm`
    : "--";

  const thicknessSummary = `${formatNumber(params.minThicknessMm, 1)}-${formatNumber(
    params.maxThicknessMm,
    1
  )} mm`;

  const workflowLabel = isExporting
    ? copy.workflow.exporting
    : isPreviewPending
      ? copy.workflow.generating
      : hasExportablePreview
        ? copy.workflow.downloadable
        : imageInfo
          ? copy.workflow.loaded
          : copy.workflow.waiting;

  const statusText = getStatusText(status, language);

  useEffect(() => {
    const worker = new Worker(
      new URL("./workers/lithophane.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data;

      if (msg.type === "IMAGE_READY") {
        if (msg.imageRequestId !== latestImageIdRef.current) return;

        const info: ImageInfo = {
          imageWidth: msg.imageWidth,
          imageHeight: msg.imageHeight,
        };

        imageInfoRef.current = info;
        setImageInfo(info);
        setIsImageReady(true);
        setStatus({
          key: "imageProcessed",
          tone: "busy",
          values: { width: msg.imageWidth, height: msg.imageHeight },
        });
        requestPreview(paramsRef.current, info, {
          immediate: true,
          imageRequestId: msg.imageRequestId,
        });
        return;
      }

      if (msg.type === "PREVIEW_READY") {
        handlePreviewReady(msg);
        return;
      }

      if (msg.type === "EXPORT_3MF_DONE") {
        if (
          msg.requestId !== latestExportIdRef.current ||
          msg.imageRequestId !== lastPreviewSnapshotRef.current?.imageRequestId
        ) {
          return;
        }

        const blob = new Blob([msg.buffer], { type: "model/3mf" });
        triggerDownload(blob, "lithophane.3mf");
        setIsExporting(false);
        setStatus({ key: "modelGenerated", tone: "ready" });
        return;
      }

      handleWorkerError(msg);
    };

    return () => {
      cancelPendingPreviewDebounce();
      cancelResolutionDebounce();
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  function bumpImageId(): number {
    const id = ++imageSeqRef.current;
    latestImageIdRef.current = id;
    return id;
  }

  function bumpPreviewId(): number {
    const id = ++previewSeqRef.current;
    latestPreviewIdRef.current = id;
    return id;
  }

  function bumpExportId(): number {
    const id = ++exportSeqRef.current;
    latestExportIdRef.current = id;
    return id;
  }

  function markPreviewStarted(id: number) {
    pendingPreviewIdsRef.current.add(id);
    setIsPreviewPending(true);
  }

  function markPreviewFinished(id: number) {
    pendingPreviewIdsRef.current.delete(id);
    if (pendingPreviewIdsRef.current.size === 0) {
      setIsPreviewPending(false);
    }
  }

  function cancelPendingPreviewDebounce() {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }

  function cancelResolutionDebounce() {
    if (resolutionDebounceTimerRef.current !== null) {
      window.clearTimeout(resolutionDebounceTimerRef.current);
      resolutionDebounceTimerRef.current = null;
    }
  }

  function invalidatePreviewState() {
    cancelPendingPreviewDebounce();
    bumpPreviewId();
    pendingPreviewIdsRef.current.clear();
    setIsPreviewPending(false);
    setHasExportablePreview(false);
    setPreviewStats(null);
    lastPreviewSnapshotRef.current = null;
    lastPositionsRef.current = null;
    lastTBufferRef.current = null;
    viewerRef.current?.clear();
  }

  function canApplyAffineLocally(next: Params): boolean {
    const snapshot = lastPreviewSnapshotRef.current;
    return Boolean(
      snapshot &&
        snapshot.imageRequestId === latestImageIdRef.current &&
        lastPositionsRef.current &&
        lastTBufferRef.current &&
        sameHeightMapParams(snapshot.params, next)
    );
  }

  function handlePreviewReady(msg: PreviewReadyResponse) {
    markPreviewFinished(msg.requestId);

    if (
      msg.requestId !== latestPreviewIdRef.current ||
      msg.imageRequestId !== latestImageIdRef.current
    ) {
      return;
    }

    const master = new Float32Array(msg.positionsBuffer);
    const indices =
      msg.indexType === "uint32"
        ? new Uint32Array(msg.indicesBuffer)
        : new Uint16Array(msg.indicesBuffer);
    const tBuffer = new Float32Array(msg.tBuffer);

    lastPositionsRef.current = master;
    lastTBufferRef.current = tBuffer;
    viewerRef.current?.setMesh(master.slice(), indices);

    const currentImageInfo = imageInfoRef.current;
    if (currentImageInfo) {
      lastPreviewSnapshotRef.current = {
        previewId: msg.requestId,
        imageRequestId: msg.imageRequestId,
        params: { ...paramsRef.current },
        imageInfo: currentImageInfo,
      };
      setHasExportablePreview(true);
      setPreviewStats({
        vertexCount: msg.vertexCount,
        triangleCount: msg.triangleCount,
      });
    }

    setStatus({ key: "previewUpdated", tone: "ready" });
  }

  function handleWorkerError(msg: Extract<WorkerResponse, { type: "ERROR" }>) {
    if (
      msg.imageRequestId !== undefined &&
      msg.imageRequestId !== latestImageIdRef.current
    ) {
      return;
    }

    if (msg.failedType === "export") {
      if (msg.requestId === latestExportIdRef.current) {
        setIsExporting(false);
        setStatus({
          key: "exportFailed",
          tone: "error",
          values: { message: msg.message },
        });
      }
      return;
    }

    if (msg.failedType === "preview") {
      if (msg.requestId !== undefined) markPreviewFinished(msg.requestId);
      setHasExportablePreview(false);
      setPreviewStats(null);
      setStatus({
        key: "previewFailed",
        tone: "error",
        values: { message: msg.message },
      });
      return;
    }

    setIsImageReady(false);
    setHasExportablePreview(false);
    setPreviewStats(null);
    setStatus({
      key: "imageFailed",
      tone: "error",
      values: { message: msg.message },
    });
  }

  async function handleFileChange(file: File | null) {
    if (!file) return;

    if (!isSupportedImageFile(file)) {
      setStatus({ key: "unsupportedFile", tone: "error" });
      return;
    }

    const imageRequestId = bumpImageId();
    sourceFileRef.current = file;
    setSourceName(file.name);
    setSourceSize(file.size);
    setSourcePreview(file);
    setIsImageReady(false);
    setImageInfo(null);
    imageInfoRef.current = null;
    cancelResolutionDebounce();
    invalidatePreviewState();

    await sendImageToWorker(
      file,
      paramsRef.current.sampleLongSide,
      imageRequestId
    );
  }

  async function handleSampleImage() {
    try {
      await handleFileChange(await createSampleImageFile(copy.sampleFileName));
    } catch (error) {
      setStatus({
        key: "sampleFailed",
        tone: "error",
        values: { message: getErrorMessage(error) },
      });
    }
  }

  function handleDrop(event: React.DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleFileChange(event.dataTransfer.files?.[0] ?? null);
  }

  async function sendImageToWorker(
    file: File,
    sampleLongSide: number,
    imageRequestId: number
  ) {
    setStatus({ key: "readingImage", tone: "busy" });

    let bitmap: ImageBitmap | null = null;

    try {
      bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      });

      if (imageRequestId !== latestImageIdRef.current) {
        bitmap.close();
        return;
      }

      const liveWorker = workerRef.current;
      if (!liveWorker) {
        bitmap.close();
        return;
      }

      liveWorker.postMessage(
        {
          type: "SET_IMAGE",
          imageRequestId,
          bitmap,
          preprocessOptions: {
            maxLongSide: sampleLongSide,
            lockAspect: true,
            alphaBackground: 1,
          },
        },
        [bitmap]
      );
    } catch (error) {
      if (bitmap) bitmap.close();
      if (imageRequestId === latestImageIdRef.current) {
        setIsImageReady(false);
        setStatus({
          key: "imageReadFailed",
          tone: "error",
          values: { message: getErrorMessage(error) },
        });
      }
    }
  }

  function updateParams(nextPartial: Partial<Params>) {
    cancelPendingPreviewDebounce();

    const next = sanitizeParams({
      ...paramsRef.current,
      ...nextPartial,
    });

    setParams(next);
    paramsRef.current = next;

    const info = imageInfoRef.current;
    if (!info || !isImageReady) return;

    const changedKeys = Object.keys(nextPartial) as (keyof Params)[];

    if (changedKeys.includes("sampleLongSide")) {
      const imageRequestId = bumpImageId();
      cancelResolutionDebounce();
      invalidatePreviewState();
      setIsImageReady(false);
      setStatus({ key: "waitingResample", tone: "busy" });

      resolutionDebounceTimerRef.current = window.setTimeout(() => {
        reloadCurrentFileWithResolution(
          paramsRef.current.sampleLongSide,
          imageRequestId
        );
      }, 250);

      return;
    }

    const onlyAffine = changedKeys.every(
      (key) =>
        key === "physicalWidthMm" ||
        key === "minThicknessMm" ||
        key === "maxThicknessMm"
    );

    if (onlyAffine && canApplyAffineLocally(next)) {
      const id = bumpPreviewId();
      pendingPreviewIdsRef.current.clear();
      setIsPreviewPending(false);
      applyAffinePreviewUpdate(next, info);

      lastPreviewSnapshotRef.current = {
        previewId: id,
        imageRequestId: latestImageIdRef.current,
        params: { ...next },
        imageInfo: info,
      };
      setHasExportablePreview(true);
      return;
    }

    requestPreview(next, info, {
      immediate: false,
      imageRequestId: latestImageIdRef.current,
    });
  }

  async function reloadCurrentFileWithResolution(
    sampleLongSide: number,
    imageRequestId: number
  ) {
    const file = sourceFileRef.current;
    if (!file || imageRequestId !== latestImageIdRef.current) return;

    setStatus({ key: "resampling", tone: "busy" });
    await sendImageToWorker(file, sampleLongSide, imageRequestId);
  }

  function requestPreview(
    nextParams: Params,
    info: ImageInfo,
    options: { immediate: boolean; imageRequestId: number }
  ) {
    if (!workerRef.current) return;

    cancelPendingPreviewDebounce();
    setHasExportablePreview(false);

    const run = () => {
      const worker = workerRef.current;
      if (!worker || options.imageRequestId !== latestImageIdRef.current) return;

      const requestId = bumpPreviewId();
      markPreviewStarted(requestId);

      const heightMm =
        nextParams.physicalWidthMm * (info.imageHeight / info.imageWidth);

      worker.postMessage({
        type: "GENERATE_PREVIEW",
        requestId,
        imageRequestId: options.imageRequestId,
        preprocessOptions: {
          contrast: nextParams.contrast,
          gamma: nextParams.gamma,
          invert: nextParams.invert,
        },
        meshOptions: {
          physicalWidthMm: nextParams.physicalWidthMm,
          physicalHeightMm: heightMm,
          minThicknessMm: nextParams.minThicknessMm,
          maxThicknessMm: nextParams.maxThicknessMm,
        },
      });

      setStatus({ key: "generatingPreview", tone: "busy" });
    };

    if (options.immediate) {
      run();
    } else {
      debounceTimerRef.current = window.setTimeout(run, 70);
    }
  }

  function applyAffinePreviewUpdate(nextParams: Params, info: ImageInfo) {
    const positions = lastPositionsRef.current;
    const tBuffer = lastTBufferRef.current;
    if (!positions || !tBuffer) return;

    const { imageWidth: width, imageHeight: height } = info;
    const physicalWidthMm = nextParams.physicalWidthMm;
    const physicalHeight = physicalWidthMm * (height / width);
    const minThickness = nextParams.minThicknessMm;
    const maxThickness = nextParams.maxThicknessMm;
    const thicknessRange = maxThickness - minThickness;
    const dx = physicalWidthMm / (width - 1);
    const dy = physicalHeight / (height - 1);
    const halfW = physicalWidthMm / 2;
    const halfH = physicalHeight / 2;
    const gridVertexCount = width * height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gridIndex = y * width + x;
        const px = x * dx - halfW;
        const py = halfH - y * dy;
        const z = minThickness + tBuffer[gridIndex] * thicknessRange;

        writePosition(positions, gridIndex, px, py, z);
        writePosition(positions, gridVertexCount + gridIndex, px, py, 0);
      }
    }

    viewerRef.current?.updatePositions(positions, { refit: false });
    setStatus({ key: "sizeUpdated", tone: "ready" });
  }

  function export3mf() {
    const worker = workerRef.current;
    const snapshot = lastPreviewSnapshotRef.current;

    if (!worker || !snapshot) {
      setStatus({ key: "previewRequired", tone: "error" });
      return;
    }

    const requestId = bumpExportId();
    const { params: p, imageInfo: info } = snapshot;
    const heightMm = p.physicalWidthMm * (info.imageHeight / info.imageWidth);

    setIsExporting(true);
    setStatus({ key: "generating3mf", tone: "busy" });

    worker.postMessage({
      type: "EXPORT_3MF",
      requestId,
      imageRequestId: snapshot.imageRequestId,
      preprocessOptions: {
        contrast: p.contrast,
        gamma: p.gamma,
        invert: p.invert,
      },
      meshOptions: {
        physicalWidthMm: p.physicalWidthMm,
        physicalHeightMm: heightMm,
        minThicknessMm: p.minThicknessMm,
        maxThicknessMm: p.maxThicknessMm,
      },
      exportOptions: {
        modelName: "lithophane",
        application: "Browser Lithophane Generator",
        precision: 4,
        compress: true,
      },
    });
  }

  function resetParams() {
    setParams(DEFAULT_PARAMS);
    paramsRef.current = DEFAULT_PARAMS;

    const info = imageInfoRef.current;
    if (info && isImageReady) {
      requestPreview(DEFAULT_PARAMS, info, {
        immediate: false,
        imageRequestId: latestImageIdRef.current,
      });
    }
  }

  function setSourcePreview(file: File) {
    revokeSourcePreviewUrl();
    const url = URL.createObjectURL(file);
    sourcePreviewUrlRef.current = url;
    setSourcePreviewUrl(url);
  }

  function revokeSourcePreviewUrl() {
    if (!sourcePreviewUrlRef.current) return;
    URL.revokeObjectURL(sourcePreviewUrlRef.current);
    sourcePreviewUrlRef.current = null;
  }

  const canDownload =
    hasExportablePreview && !isPreviewPending && !isExporting && isImageReady;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark">3MF</div>
          <div>
            <p className="eyebrow">{copy.brand}</p>
            <h1>{copy.appTitle}</h1>
          </div>
        </div>

        <div className="header-actions">
          <div className="language-switch" aria-label={copy.languageLabel}>
            <button
              type="button"
              className={language === "zh" ? "is-selected" : ""}
              aria-pressed={language === "zh"}
              onClick={() => setLanguage("zh")}
            >
              {copy.zhLabel}
            </button>
            <button
              type="button"
              className={language === "en" ? "is-selected" : ""}
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              {copy.enLabel}
            </button>
          </div>
          <span className={`state-pill tone-${status.tone}`}>{workflowLabel}</span>
          <IconButton label={copy.resetParams} onClick={resetParams}>
            <RefreshCcw size={18} />
          </IconButton>
        </div>
      </header>

      <section className="workspace">
        <aside className="control-panel" aria-label={copy.output}>
          <ControlSection icon={<ImagePlus size={18} />} title={copy.input}>
            <input
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) =>
                handleFileChange(event.target.files?.[0] ?? null)
              }
            />

            <button
              type="button"
              className={`upload-zone ${isDragging ? "is-dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <span className="thumb-frame">
                {sourcePreviewUrl ? (
                  <img src={sourcePreviewUrl} alt="" />
                ) : (
                  <Upload size={22} />
                )}
              </span>
              <span className="upload-copy">
                <strong>{sourceName || copy.uploadImage}</strong>
                <span>
                  {sourceName
                    ? `${formatFileSize(sourceSize)}`
                    : copy.fileTypes}
                </span>
              </span>
            </button>

            <button type="button" className="sample-button" onClick={handleSampleImage}>
              <Sparkles size={17} />
              <span>{copy.sampleImage}</span>
            </button>
          </ControlSection>

          <ControlSection icon={<Ruler size={18} />} title={copy.size}>
            <div className="segmented-control" aria-label={copy.widthPresetLabel}>
              {SIZE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.value}
                  className={
                    params.physicalWidthMm === preset.value ? "is-selected" : ""
                  }
                  onClick={() => updateParams({ physicalWidthMm: preset.value })}
                >
                  {preset.label}mm
                </button>
              ))}
            </div>

            <ControlSlider
              label={copy.sampleLongSide}
              value={params.sampleLongSide}
              min={200}
              max={700}
              step={50}
              suffix="px"
              decimals={0}
              onChange={(value) => updateParams({ sampleLongSide: value })}
            />
            <ControlSlider
              label={copy.modelWidth}
              value={params.physicalWidthMm}
              min={40}
              max={180}
              step={1}
              suffix="mm"
              decimals={0}
              onChange={(value) => updateParams({ physicalWidthMm: value })}
            />
            <MetricRow
              label={copy.modelHeight}
              value={physicalHeightMm ? `${formatNumber(physicalHeightMm, 1)}mm` : "--"}
            />
            <ControlSlider
              label={copy.minThickness}
              value={params.minThicknessMm}
              min={0.6}
              max={2}
              step={0.1}
              suffix="mm"
              decimals={1}
              onChange={(value) => updateParams({ minThicknessMm: value })}
            />
            <ControlSlider
              label={copy.maxThickness}
              value={params.maxThicknessMm}
              min={2}
              max={6}
              step={0.1}
              suffix="mm"
              decimals={1}
              onChange={(value) => updateParams({ maxThicknessMm: value })}
            />
          </ControlSection>

          <ControlSection icon={<Gauge size={18} />} title={copy.image}>
            <ControlSlider
              label={copy.contrast}
              value={params.contrast}
              min={-1}
              max={1}
              step={0.05}
              suffix=""
              decimals={2}
              onChange={(value) => updateParams({ contrast: value })}
            />
            <ControlSlider
              label={copy.gamma}
              value={params.gamma}
              min={0.4}
              max={2.5}
              step={0.05}
              suffix=""
              decimals={2}
              onChange={(value) => updateParams({ gamma: value })}
            />
            <label className="switch-row">
              <span>{copy.invert}</span>
              <input
                type="checkbox"
                checked={params.invert}
                onChange={(event) => updateParams({ invert: event.target.checked })}
              />
            </label>
          </ControlSection>

          <ControlSection icon={<FileDown size={18} />} title={copy.output}>
            <div className="summary-grid">
              <SummaryMetric
                label={copy.sourceImage}
                value={imageInfo ? `${imageInfo.imageWidth} x ${imageInfo.imageHeight}px` : "--"}
              />
              <SummaryMetric label={copy.model} value={sizeSummary} />
              <SummaryMetric label={copy.thickness} value={thicknessSummary} />
              <SummaryMetric
                label={copy.mesh}
                value={
                  previewStats
                    ? `${formatCompact(previewStats.triangleCount, language)} ${copy.faces}`
                    : "--"
                }
              />
            </div>

            <button
              type="button"
              className="download-button"
              disabled={!canDownload}
              onClick={export3mf}
            >
              {isExporting ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Download size={18} />
              )}
              <span>{isExporting ? copy.generating : copy.download3mf}</span>
            </button>
          </ControlSection>
        </aside>

        <section className="preview-panel">
          <div className="preview-toolbar">
            <div className="preview-title">
              <Box size={18} />
              <span>{copy.preview3d}</span>
            </div>
            <div className="preview-actions">
              <button
                type="button"
                className="toolbar-download"
                disabled={!canDownload}
                onClick={export3mf}
              >
                {isExporting ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Download size={17} />
                )}
                <span>{isExporting ? copy.generating : copy.download3mf}</span>
              </button>
              <IconButton
                label={copy.fitView}
                disabled={!hasExportablePreview}
                onClick={() => viewerRef.current?.resetView()}
              >
                <Maximize2 size={18} />
              </IconButton>
            </div>
          </div>

          <LithophaneViewer
            ref={viewerRef}
            emptyLabel={copy.waitingImage}
            previewLabel={copy.preview3d}
          />

          <div className={`status-bar tone-${status.tone}`} role="status" aria-live="polite">
            {status.tone === "busy" ? <LoaderCircle className="spin" size={16} /> : null}
            {status.tone === "ready" ? <CheckCircle2 size={16} /> : null}
            {status.tone === "error" ? <AlertCircle size={16} /> : null}
            {status.tone === "idle" ? <Layers3 size={16} /> : null}
            <span>{statusText}</span>
            {previewStats ? (
              <span className="status-meta">
                {formatCompact(previewStats.vertexCount, language)} {copy.vertices} ·{" "}
                {formatCompact(previewStats.triangleCount, language)} {copy.faces}
              </span>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function ControlSection(props: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="control-section">
      <div className="section-heading">
        {props.icon}
        <span>{props.title}</span>
      </div>
      <div className="section-body">{props.children}</div>
    </section>
  );
}

function ControlSlider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  decimals: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="control-slider">
      <span className="slider-top">
        <span>{props.label}</span>
        <span className="number-field">
          <input
            aria-label={`${props.label} value`}
            type="number"
            min={props.min}
            max={props.max}
            step={props.step}
            value={formatNumber(props.value, props.decimals)}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isFinite(value)) props.onChange(value);
            }}
          />
          {props.suffix ? <em>{props.suffix}</em> : null}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(event) => props.onChange(Number(event.target.value))}
      />
    </label>
  );
}

function MetricRow(props: { label: string; value: string }) {
  return (
    <div className="metric-row">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function SummaryMetric(props: { label: string; value: string }) {
  return (
    <div className="summary-metric">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

function IconButton(props: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="icon-button"
      disabled={props.disabled}
      onClick={props.onClick}
      title={props.label}
      aria-label={props.label}
    >
      {props.children}
    </button>
  );
}

function getStatusText(status: StatusMessage, language: Language): string {
  const values = status.values ? { ...status.values } : undefined;
  if (values?.message) {
    values.message = localizeErrorMessage(String(values.message), language);
  }

  return COPY[language].status[status.key](values);
}

function getInitialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem("lithophane-language");
    if (stored === "zh" || stored === "en") return stored;
  } catch {
    // Fall through to the browser language if storage is unavailable.
  }
  return navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
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

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createSampleImageFile(filename: string): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 540;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas-unsupported");
  }

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#111827");
  gradient.addColorStop(0.45, "#e7ecef");
  gradient.addColorStop(1, "#ffffff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.beginPath();
  ctx.arc(675, 150, 90, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(17,24,39,0.72)";
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.roundRect(110 + i * 76, 330 - i * 18, 54, 170 + i * 16, 12);
    ctx.fill();
  }

  ctx.fillStyle = "rgba(16,117,108,0.75)";
  ctx.beginPath();
  ctx.moveTo(110, 420);
  ctx.bezierCurveTo(260, 280, 420, 460, 560, 340);
  ctx.bezierCurveTo(650, 260, 730, 390, 800, 310);
  ctx.lineTo(820, 540);
  ctx.lineTo(90, 540);
  ctx.closePath();
  ctx.fill();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("canvas-export-failed"));
        return;
      }

      resolve(new File([blob], filename, { type: "image/png" }));
    }, "image/png");
  });
}

function isSupportedImageFile(file: File): boolean {
  if (file.type.includes("svg") || /\.svg$/i.test(file.name)) return false;
  if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) return true;
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function localizeErrorMessage(message: string, language: Language): string {
  const map: Record<string, Record<Language, string>> = {
    "canvas-unsupported": {
      zh: "当前浏览器不支持 Canvas。",
      en: "This browser does not support Canvas.",
    },
    "canvas-export-failed": {
      zh: "Canvas 导出失败。",
      en: "Canvas export failed.",
    },
    "当前浏览器不支持 OffscreenCanvas 2D 渲染。": {
      zh: "当前浏览器不支持 OffscreenCanvas 2D 渲染。",
      en: "This browser does not support OffscreenCanvas 2D rendering.",
    },
    "图片采样尺寸太小，至少需要 2 x 2 像素。": {
      zh: "图片采样尺寸太小，至少需要 2 x 2 像素。",
      en: "The sampled image is too small. At least 2 x 2 pixels are required.",
    },
    "高度图尺寸与像素数据长度不一致。": {
      zh: "高度图尺寸与像素数据长度不一致。",
      en: "Height map dimensions do not match the pixel data length.",
    },
    "图片缓存已过期，请等待最新图片处理完成。": {
      zh: "图片缓存已过期，请等待最新图片处理完成。",
      en: "The image cache is stale. Wait for the latest image to finish processing.",
    },
  };

  return map[message]?.[language] ?? message;
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "--";
  if (bytes < 1024 * 1024) return `${formatNumber(bytes / 1024, 0)} KB`;
  return `${formatNumber(bytes / (1024 * 1024), 1)} MB`;
}

function formatCompact(value: number, language: Language): string {
  return new Intl.NumberFormat(language === "zh" ? "zh-CN" : "en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatNumber(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}
