'use client';

import {
  ChangeEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Circle,
  Canvas as FabricCanvas,
  FabricImage,
  FabricObject,
  Rect,
  Textbox,
} from 'fabric';
import {
  CircleIcon,
  Download,
  FileDown,
  FileUp,
  ImagePlus,
  Layers,
  LayoutTemplate,
  MousePointer2,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
  Square,
  Trash2,
  Type,
} from 'lucide-react';

type LayerItem = {
  id: string;
  label: string;
  type: string;
};

type CanvasPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
};

type BrandKit = {
  primary: string;
  secondary: string;
  accent: string;
  font: string;
  logoDataUrl: string | null;
};

type StoredTemplate = {
  id: string;
  name: string;
  json: object;
  width: number;
  height: number;
};

type BuiltInTemplate = {
  id: string;
  name: string;
  presetId: string;
  build: (brand: BrandKit) => FabricObject[];
};

type ExportFormat = 'png' | 'jpeg' | 'webp';

type CanvasPoint = {
  x: number;
  y: number;
};

type MagicSelectClick = [number, number, 0 | 1];
type MagicSelectionState = 'empty' | 'selecting' | 'ready' | 'applying';

const CANVAS_PRESETS: CanvasPreset[] = [
  { id: 'instagram-square', label: 'Instagram Post', width: 1080, height: 1080 },
  { id: 'instagram-story', label: 'Story/Reel', width: 1080, height: 1920 },
  { id: 'linkedin-post', label: 'LinkedIn Post', width: 1200, height: 627 },
  { id: 'youtube-thumb', label: 'YouTube Thumb', width: 1280, height: 720 },
];

const DEFAULT_BRAND: BrandKit = {
  primary: '#17201f',
  secondary: '#f6b35a',
  accent: '#66a182',
  font: 'Inter, Arial, sans-serif',
  logoDataUrl: null,
};

const SAVED_TEMPLATES_KEY = 'shadyy-editor-templates';
const BRAND_KIT_KEY = 'shadyy-editor-brand-kit';

function objectId(object: FabricObject) {
  const existing = object.get('id') as string | undefined;

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  object.set('id', id);
  return id;
}

function objectLabel(object: FabricObject, index: number) {
  const name = object.get('name') as string | undefined;
  if (name) return name;

  if (object.type === 'textbox') return `Text ${index + 1}`;
  if (object.type === 'image') return `Image ${index + 1}`;
  if (object.type === 'rect') return `Rectangle ${index + 1}`;
  if (object.type === 'circle') return `Circle ${index + 1}`;

  return `Layer ${index + 1}`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function canvasJson(canvas: FabricCanvas) {
  return (canvas as unknown as { toJSON: (properties: string[]) => object }).toJSON([
    'id',
    'name',
  ]);
}

function fitPreviewSize(size: CanvasPreset) {
  const maxWidth = 760;
  const maxHeight = 760;
  const scale = Math.min(maxWidth / size.width, maxHeight / size.height, 1);

  return {
    width: Math.round(size.width * scale),
    height: Math.round(size.height * scale),
  };
}

function magicToolErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;

  if (error.message === 'Failed to fetch') {
    return 'Unable to reach the local IOPaint service. Start it on http://127.0.0.1:18080.';
  }

  return error.message;
}

function applyFabricPreviewSize(canvas: FabricCanvas, width: number, height: number) {
  const lowerCanvas = canvas.getElement();
  const wrapper = lowerCanvas.parentElement;
  const upperCanvas = wrapper?.querySelector<HTMLCanvasElement>('.upper-canvas');

  lowerCanvas.style.width = `${width}px`;
  lowerCanvas.style.height = `${height}px`;
  lowerCanvas.style.background = '#ffffff';

  if (upperCanvas) {
    upperCanvas.style.width = `${width}px`;
    upperCanvas.style.height = `${height}px`;
    upperCanvas.style.background = 'transparent';
  }

  if (wrapper) {
    wrapper.style.width = `${width}px`;
    wrapper.style.height = `${height}px`;
    wrapper.style.background = '#ffffff';
  }
}

const builtInTemplates: BuiltInTemplate[] = [
  {
    id: 'launch',
    name: 'Launch Post',
    presetId: 'instagram-square',
    build: (brand) => [
      new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1080,
        fill: '#f7faf8',
        name: 'Background',
        selectable: false,
      }),
      new Circle({
        left: 685,
        top: 96,
        radius: 230,
        fill: brand.accent,
        opacity: 0.28,
        name: 'Accent Circle',
      }),
      new Rect({
        left: 92,
        top: 120,
        width: 190,
        height: 56,
        fill: brand.secondary,
        rx: 8,
        ry: 8,
        name: 'Label Shape',
      }),
      new Textbox('NEW DROP', {
        left: 118,
        top: 134,
        width: 150,
        fontFamily: brand.font,
        fontSize: 26,
        fontWeight: '800',
        fill: brand.primary,
        name: 'Label',
      }),
      new Textbox('Launch your next offer', {
        left: 92,
        top: 250,
        width: 720,
        fontFamily: brand.font,
        fontSize: 92,
        fontWeight: '800',
        fill: brand.primary,
        name: 'Headline',
      }),
      new Textbox('A clean social post template for announcements, launches, and lead magnets.', {
        left: 96,
        top: 580,
        width: 680,
        fontFamily: brand.font,
        fontSize: 34,
        lineHeight: 1.22,
        fill: '#5f6b66',
        name: 'Supporting Copy',
      }),
      new Rect({
        left: 96,
        top: 840,
        width: 330,
        height: 84,
        fill: brand.primary,
        rx: 8,
        ry: 8,
        name: 'CTA Shape',
      }),
      new Textbox('Get started', {
        left: 134,
        top: 862,
        width: 240,
        fontFamily: brand.font,
        fontSize: 32,
        fontWeight: '800',
        fill: '#ffffff',
        name: 'CTA Text',
      }),
    ],
  },
  {
    id: 'offer',
    name: 'Offer Card',
    presetId: 'instagram-square',
    build: (brand) => [
      new Rect({
        left: 0,
        top: 0,
        width: 1080,
        height: 1080,
        fill: brand.primary,
        name: 'Background',
        selectable: false,
      }),
      new Rect({
        left: 86,
        top: 86,
        width: 908,
        height: 908,
        fill: '#ffffff',
        rx: 10,
        ry: 10,
        name: 'Card',
      }),
      new Textbox('LIMITED OFFER', {
        left: 140,
        top: 150,
        width: 420,
        fontFamily: brand.font,
        fontSize: 30,
        fontWeight: '800',
        fill: brand.accent,
        name: 'Eyebrow',
      }),
      new Textbox('Build better content in half the time', {
        left: 140,
        top: 245,
        width: 760,
        fontFamily: brand.font,
        fontSize: 78,
        fontWeight: '800',
        lineHeight: 0.96,
        fill: brand.primary,
        name: 'Headline',
      }),
      new Textbox('Swap this copy, apply your brand, and export a polished promo graphic.', {
        left: 144,
        top: 558,
        width: 680,
        fontFamily: brand.font,
        fontSize: 34,
        lineHeight: 1.2,
        fill: '#68737d',
        name: 'Body',
      }),
      new Rect({
        left: 140,
        top: 790,
        width: 800,
        height: 120,
        fill: brand.secondary,
        rx: 8,
        ry: 8,
        name: 'Footer Band',
      }),
      new Textbox('Use code BRAND25', {
        left: 184,
        top: 825,
        width: 620,
        fontFamily: brand.font,
        fontSize: 42,
        fontWeight: '800',
        fill: brand.primary,
        name: 'Footer Text',
      }),
    ],
  },
  {
    id: 'quote',
    name: 'Quote Graphic',
    presetId: 'linkedin-post',
    build: (brand) => [
      new Rect({
        left: 0,
        top: 0,
        width: 1200,
        height: 627,
        fill: '#f5f0e7',
        name: 'Background',
        selectable: false,
      }),
      new Rect({
        left: 64,
        top: 64,
        width: 1072,
        height: 499,
        fill: '#ffffff',
        rx: 8,
        ry: 8,
        name: 'Card',
      }),
      new Textbox('“', {
        left: 106,
        top: 88,
        width: 160,
        fontFamily: 'Georgia, serif',
        fontSize: 150,
        fill: brand.secondary,
        name: 'Quote Mark',
      }),
      new Textbox('The best marketing asset is the one your team can actually ship today.', {
        left: 164,
        top: 178,
        width: 820,
        fontFamily: brand.font,
        fontSize: 54,
        fontWeight: '800',
        lineHeight: 1.05,
        fill: brand.primary,
        name: 'Quote',
      }),
      new Textbox('Your Brand', {
        left: 168,
        top: 470,
        width: 320,
        fontFamily: brand.font,
        fontSize: 30,
        fontWeight: '800',
        fill: brand.accent,
        name: 'Attribution',
      }),
    ],
  },
];

export function MilestoneOneEditor() {
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const isPaintingMaskRef = useRef(false);
  const lastMaskPointRef = useRef<CanvasPoint | null>(null);
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasPreset>(CANVAS_PRESETS[0]);
  const [brand, setBrand] = useState<BrandKit>(DEFAULT_BRAND);
  const [savedTemplates, setSavedTemplates] = useState<StoredTemplate[]>([]);
  const [exportPresetId, setExportPresetId] = useState(CANVAS_PRESETS[0].id);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [imageUploadStatus, setImageUploadStatus] = useState(
    'Upload an image to start editing photos.',
  );
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [backgroundRemovalStatus, setBackgroundRemovalStatus] = useState(
    'Select an image layer to remove its background.',
  );
  const [isMaskMode, setIsMaskMode] = useState(false);
  const [maskTargetId, setMaskTargetId] = useState<string | null>(null);
  const [maskBrushSize, setMaskBrushSize] = useState(44);
  const [isInpainting, setIsInpainting] = useState(false);
  const [isLiftingObject, setIsLiftingObject] = useState(false);
  const [isMagicSelectMode, setIsMagicSelectMode] = useState(false);
  const [isGeneratingMask, setIsGeneratingMask] = useState(false);
  const [hasReadyMask, setHasReadyMask] = useState(false);
  const [magicSelectClicks, setMagicSelectClicks] = useState<MagicSelectClick[]>([]);
  const [magicEraserStatus, setMagicEraserStatus] = useState(
    'Select an image layer, then paint the area to erase.',
  );
  const previewSize = useMemo(() => fitPreviewSize(canvasSize), [canvasSize]);
  const magicAddClicks = magicSelectClicks.filter((click) => click[2] === 1).length;
  const magicSubtractClicks = magicSelectClicks.length - magicAddClicks;
  const isApplyingMagicTool = isInpainting || isLiftingObject;
  const magicSelectionState: MagicSelectionState = isApplyingMagicTool
    ? 'applying'
    : isGeneratingMask
      ? 'selecting'
      : hasReadyMask
        ? 'ready'
        : 'empty';
  const exportPreset =
    CANVAS_PRESETS.find((preset) => preset.id === exportPresetId) ??
    CANVAS_PRESETS[0];

  const refreshLayers = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const items = canvas
      .getObjects()
      .map((object, index) => ({
        id: objectId(object),
        label: objectLabel(object, index),
        type: object.type ?? 'object',
      }))
      .reverse();

    const selected = canvas.getActiveObject();
    setSelectedId(selected ? objectId(selected) : null);
    setLayers(items);
  }, []);

  const setCanvasPreset = useCallback(
    (preset: CanvasPreset) => {
      const canvas = canvasRef.current;
      setCanvasSize(preset);
      setIsMaskMode(false);
      setIsMagicSelectMode(false);
      setMaskTargetId(null);
      setMagicSelectClicks([]);
      setHasReadyMask(false);

      if (!canvas) return;

      canvas.setDimensions({
        width: preset.width,
        height: preset.height,
      });
      applyFabricPreviewSize(canvas, previewSize.width, previewSize.height);
      canvas.requestRenderAll();
      refreshLayers();
    },
    [previewSize.height, previewSize.width, refreshLayers],
  );

  const clearMaskCanvas = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    const context = maskCanvas?.getContext('2d');
    if (!maskCanvas || !context) return;

    context.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    setHasReadyMask(false);
  }, []);

  const findImageById = useCallback((id: string | null) => {
    const canvas = canvasRef.current;
    if (!canvas || !id) return null;

    const target = canvas
      .getObjects()
      .find((object) => objectId(object) === id);

    return target?.type === 'image' ? (target as FabricImage) : null;
  }, []);

  const startMagicMask = () => {
    const canvas = canvasRef.current;
    const selected = canvas?.getActiveObject();

    if (!canvas || !selected || selected.type !== 'image') {
      setMagicEraserStatus('Select an image layer before masking.');
      return;
    }

    setMaskTargetId(objectId(selected));
    setIsMaskMode(true);
    setIsMagicSelectMode(false);
    setMagicSelectClicks([]);
    clearMaskCanvas();
    setMagicEraserStatus('Paint the area, then apply erase or lift.');
  };

  const startMagicSelect = () => {
    const canvas = canvasRef.current;
    const selected = canvas?.getActiveObject();

    if (!canvas || !selected || selected.type !== 'image') {
      setMagicEraserStatus('Select an image layer before magic select.');
      return;
    }

    if (Math.abs(((selected as FabricImage).angle ?? 0) % 360) > 0.1) {
      setMagicEraserStatus('Rotate the image back to 0 degrees before magic select.');
      return;
    }

    setMaskTargetId(objectId(selected));
    setIsMaskMode(false);
    setIsMagicSelectMode(true);
    setMagicSelectClicks([]);
    clearMaskCanvas();
    setMagicEraserStatus('Click to add to selection. Option-click to subtract.');
  };

  const stopMagicMask = () => {
    isPaintingMaskRef.current = false;
    lastMaskPointRef.current = null;
    setIsMaskMode(false);
    setIsMagicSelectMode(false);
    setMagicEraserStatus('Selection mode paused. Your current mask is still ready.');
  };

  const resetMagicMask = () => {
    isPaintingMaskRef.current = false;
    lastMaskPointRef.current = null;
    setMagicSelectClicks([]);
    clearMaskCanvas();
    setMagicEraserStatus('Mask cleared.');
  };

  const confirmMagicSelection = () => {
    if (!hasReadyMask) {
      setMagicEraserStatus('Create a mask before confirming selection.');
      return;
    }

    isPaintingMaskRef.current = false;
    lastMaskPointRef.current = null;
    setIsMaskMode(false);
    setIsMagicSelectMode(false);
    setMagicEraserStatus('Selection confirmed. Choose erase, lift, or lift + clean.');
  };

  const cancelMagicSelection = () => {
    isPaintingMaskRef.current = false;
    lastMaskPointRef.current = null;
    setIsMaskMode(false);
    setIsMagicSelectMode(false);
    setMagicSelectClicks([]);
    clearMaskCanvas();
    setMagicEraserStatus('Selection canceled.');
  };

  const pointerToCanvasPoint = (
    event: PointerEvent<HTMLCanvasElement>,
  ): CanvasPoint => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvasSize.width,
      y: ((event.clientY - rect.top) / rect.height) * canvasSize.height,
    };
  };

  const drawMaskSegment = useCallback(
    (from: CanvasPoint, to: CanvasPoint) => {
      const maskCanvas = maskCanvasRef.current;
      const context = maskCanvas?.getContext('2d');
      if (!maskCanvas || !context) return;

      context.save();
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = 'rgba(43, 156, 255, 0.78)';
      context.lineWidth = maskBrushSize;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
      context.restore();
    },
    [maskBrushSize],
  );

  const handleMaskPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (isMagicSelectMode) {
      void runMagicSelectPoint(event);
      return;
    }

    if (!isMaskMode || isApplyingMagicTool) return;

    const point = pointerToCanvasPoint(event);
    isPaintingMaskRef.current = true;
    lastMaskPointRef.current = point;
    drawMaskSegment(point, point);
    setHasReadyMask(true);
    setMagicEraserStatus('Mask ready. Continue painting, then apply erase or lift.');
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleMaskPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!isPaintingMaskRef.current || !lastMaskPointRef.current) return;

    const point = pointerToCanvasPoint(event);
    drawMaskSegment(lastMaskPointRef.current, point);
    lastMaskPointRef.current = point;
  };

  const handleMaskPointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    isPaintingMaskRef.current = false;
    lastMaskPointRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const addLogoToCanvas = useCallback(
    async (dataUrl: string) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const image = await FabricImage.fromURL(dataUrl);
      image.set({
        left: 72,
        top: 72,
        name: 'Brand Logo',
      });
      image.scaleToWidth(Math.min(canvasSize.width * 0.2, 220));
      canvas.add(image);
      canvas.setActiveObject(image);
      canvas.requestRenderAll();
      refreshLayers();
    },
    [canvasSize.width, refreshLayers],
  );

  useEffect(() => {
    queueMicrotask(() => {
      const storedBrand = localStorage.getItem(BRAND_KIT_KEY);
      const storedTemplates = localStorage.getItem(SAVED_TEMPLATES_KEY);

      if (storedBrand) {
        setBrand({ ...DEFAULT_BRAND, ...JSON.parse(storedBrand) });
      }

      if (storedTemplates) {
        setSavedTemplates(JSON.parse(storedTemplates));
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(BRAND_KIT_KEY, JSON.stringify(brand));
  }, [brand]);

  useEffect(() => {
    localStorage.setItem(SAVED_TEMPLATES_KEY, JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  useEffect(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;

    maskCanvas.width = canvasSize.width;
    maskCanvas.height = canvasSize.height;
    clearMaskCanvas();
  }, [canvasSize.height, canvasSize.width, clearMaskCanvas]);

  useEffect(() => {
    if (!canvasElementRef.current) return;

    const canvas = new FabricCanvas(canvasElementRef.current, {
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
      selection: true,
      width: canvasSize.width,
      height: canvasSize.height,
    });

    canvasRef.current = canvas;
    applyFabricPreviewSize(canvas, previewSize.width, previewSize.height);

    const update = () => {
      refreshLayers();
      canvas.requestRenderAll();
    };

    canvas.on('object:added', update);
    canvas.on('object:removed', update);
    canvas.on('object:modified', update);
    canvas.on('selection:created', update);
    canvas.on('selection:updated', update);
    canvas.on('selection:cleared', update);

    const starterText = new Textbox('New design', {
      left: 120,
      top: 120,
      width: 500,
      fontFamily: brand.font,
      fontSize: 72,
      fontWeight: '700',
      fill: brand.primary,
      name: 'Headline',
    });

    canvas.add(starterText);
    canvas.setActiveObject(starterText);
    canvas.requestRenderAll();
    refreshLayers();

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, [
    brand.font,
    brand.primary,
    canvasSize.height,
    canvasSize.width,
    previewSize.height,
    previewSize.width,
    refreshLayers,
  ]);

  const addText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const text = new Textbox('Edit text', {
      left: 160,
      top: 180,
      width: 420,
      fontFamily: brand.font,
      fontSize: 48,
      fontWeight: '600',
      fill: brand.primary,
      name: 'Text',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    refreshLayers();
  };

  const addRectangle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = new Rect({
      left: 220,
      top: 260,
      width: 360,
      height: 220,
      fill: brand.secondary,
      rx: 8,
      ry: 8,
      name: 'Rectangle',
    });

    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.requestRenderAll();
    refreshLayers();
  };

  const addCircle = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const circle = new Circle({
      left: 300,
      top: 300,
      radius: 140,
      fill: brand.accent,
      name: 'Circle',
    });

    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.requestRenderAll();
    refreshLayers();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasRef.current;
    const file = event.target.files?.[0];
    if (!canvas || !file) return;

    setImageUploadStatus(`Adding ${file.name}...`);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const image = await FabricImage.fromURL(dataUrl);
      const maxImageWidth = Math.min(canvasSize.width * 0.74, 760);
      image.scaleToWidth(maxImageWidth);
      image.set({
        left: (canvasSize.width - image.getScaledWidth()) / 2,
        top: (canvasSize.height - image.getScaledHeight()) / 2,
        name: file.name,
      });
      image.setCoords();

      canvas.add(image);
      canvas.setActiveObject(image);
      image.setCoords();
      canvas.requestRenderAll();
      refreshLayers();
      setImageUploadStatus(`${file.name} added. Select it to edit.`);
    } catch (error) {
      setImageUploadStatus(
        error instanceof Error ? error.message : 'Unable to add image.',
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const dataUrl = await readFileAsDataUrl(file);
    setBrand((current) => ({ ...current, logoDataUrl: dataUrl }));
    await addLogoToCanvas(dataUrl);
    event.target.value = '';
  };

  const deleteSelected = () => {
    const canvas = canvasRef.current;
    const selected = canvas?.getActiveObject();
    if (!canvas || !selected) return;

    canvas.remove(selected);
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    refreshLayers();
  };

  const selectLayer = (id: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const target = canvas
      .getObjects()
      .find((object) => objectId(object) === id);

    if (!target) return;

    canvas.setActiveObject(target);
    canvas.requestRenderAll();
    refreshLayers();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.requestRenderAll();
    refreshLayers();
  };

  const saveJson = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    downloadBlob(
      new Blob([JSON.stringify(canvasJson(canvas), null, 2)], {
        type: 'application/json',
      }),
      'design.json',
    );
  };

  const saveTemplate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const name = window.prompt('Template name', 'My Template');
    if (!name) return;

    setSavedTemplates((current) => [
      {
        id: crypto.randomUUID(),
        name,
        json: canvasJson(canvas),
        width: canvasSize.width,
        height: canvasSize.height,
      },
      ...current,
    ]);
  };

  const handleJsonUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasRef.current;
    const file = event.target.files?.[0];
    if (!canvas || !file) return;

    const json = await file.text();
    await canvas.loadFromJSON(json);
    canvas.backgroundColor = '#ffffff';
    canvas.requestRenderAll();
    refreshLayers();
    event.target.value = '';
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL({
      format: 'png',
      multiplier: 1,
      quality: 1,
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'design.png';
    link.click();
  };

  const exportWithSharp = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isExporting) return;

    setIsExporting(true);

    try {
      const imageDataUrl = canvas.toDataURL({
        format: 'png',
        multiplier: 1,
        quality: 1,
      });

      const response = await fetch('/api/editor/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl,
          width: exportPreset.width,
          height: exportPreset.height,
          format: exportFormat,
          quality: 92,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Export failed.');
      }

      const blob = await response.blob();
      downloadBlob(
        blob,
        `design-${exportPreset.width}x${exportPreset.height}.${exportFormat}`,
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const removeSelectedBackground = async () => {
    const canvas = canvasRef.current;
    const selected = canvas?.getActiveObject();

    if (!canvas || !selected || selected.type !== 'image' || isRemovingBackground) {
      setBackgroundRemovalStatus('Select an image layer first.');
      return;
    }

    setIsRemovingBackground(true);
    setBackgroundRemovalStatus('Loading background removal model...');

    try {
      const { removeBackground } = await import('@imgly/background-removal');
      const selectedImage = selected as FabricImage;
      const imageDataUrl = selectedImage.toDataURL({
        format: 'png',
        multiplier: 1,
        quality: 1,
      });
      const imageBlob = await fetch(imageDataUrl).then((response) => response.blob());

      setBackgroundRemovalStatus('Removing background...');

      const resultBlob = await removeBackground(imageBlob, {
        model: 'isnet_quint8',
        output: {
          format: 'image/png',
          quality: 1,
        },
        progress: (key, current, total) => {
          if (key.startsWith('download')) {
            setBackgroundRemovalStatus(`Downloading model ${current}/${total}...`);
          }
        },
      });
      const resultDataUrl = await blobToDataUrl(resultBlob);
      const replacement = await FabricImage.fromURL(resultDataUrl);

      replacement.set({
        left: selectedImage.left,
        top: selectedImage.top,
        angle: selectedImage.angle,
        scaleX: selectedImage.scaleX,
        scaleY: selectedImage.scaleY,
        flipX: selectedImage.flipX,
        flipY: selectedImage.flipY,
        opacity: selectedImage.opacity,
        name: `${selectedImage.get('name') ?? 'Image'} - background removed`,
      });

      canvas.remove(selectedImage);
      canvas.add(replacement);
      canvas.setActiveObject(replacement);
      canvas.requestRenderAll();
      refreshLayers();
      setBackgroundRemovalStatus('Background removed. Transparent PNG layer added.');
    } catch (error) {
      setBackgroundRemovalStatus(
        error instanceof Error ? error.message : 'Background removal failed.',
      );
    } finally {
      setIsRemovingBackground(false);
    }
  };

  const imageObjectToDataUrl = (image: FabricImage) => {
    const element = image.getElement();
    const width = Math.max(1, Math.round(image.width ?? element.width));
    const height = Math.max(1, Math.round(image.height ?? element.height));
    const scratch = document.createElement('canvas');
    const context = scratch.getContext('2d');

    scratch.width = width;
    scratch.height = height;
    context?.drawImage(element, 0, 0, width, height);

    return scratch.toDataURL('image/png');
  };

  const canvasPointToImageClick = (
    point: CanvasPoint,
    image: FabricImage,
    label: 0 | 1,
  ): MagicSelectClick | null => {
    const bounds = image.getBoundingRect();
    const width = Math.max(1, Math.round(image.width ?? bounds.width));
    const height = Math.max(1, Math.round(image.height ?? bounds.height));
    const relativeX = (point.x - bounds.left) / bounds.width;
    const relativeY = (point.y - bounds.top) / bounds.height;

    if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) {
      return null;
    }

    return [
      Math.round(relativeX * width),
      Math.round(relativeY * height),
      label,
    ];
  };

  const drawRemoteMaskForImage = async (maskBlob: Blob, image: FabricImage) => {
    const maskCanvas = maskCanvasRef.current;
    const context = maskCanvas?.getContext('2d');
    if (!maskCanvas || !context) return;

    const bounds = image.getBoundingRect();
    const maskUrl = URL.createObjectURL(maskBlob);
    const maskImage = new Image();
    const scratch = document.createElement('canvas');
    const scratchContext = scratch.getContext('2d');

    try {
      await new Promise<void>((resolve, reject) => {
        maskImage.onload = () => resolve();
        maskImage.onerror = () => reject(new Error('Unable to load generated mask.'));
        maskImage.src = maskUrl;
      });

      if (!scratchContext) {
        throw new Error('Unable to prepare generated mask preview.');
      }

      scratch.width = Math.max(1, Math.round(bounds.width));
      scratch.height = Math.max(1, Math.round(bounds.height));
      scratchContext.drawImage(maskImage, 0, 0, scratch.width, scratch.height);

      const imageData = scratchContext.getImageData(
        0,
        0,
        scratch.width,
        scratch.height,
      );

      for (let index = 0; index < imageData.data.length; index += 4) {
        const value = Math.max(
          imageData.data[index],
          imageData.data[index + 1],
          imageData.data[index + 2],
        );

        if (value > 16) {
          imageData.data[index] = 43;
          imageData.data[index + 1] = 156;
          imageData.data[index + 2] = 255;
          imageData.data[index + 3] = 190;
        } else {
          imageData.data[index + 3] = 0;
        }
      }

      scratchContext.putImageData(imageData, 0, 0);
      clearMaskCanvas();
      context.drawImage(
        scratch,
        bounds.left,
        bounds.top,
        bounds.width,
        bounds.height,
      );
      setHasReadyMask(true);
    } finally {
      URL.revokeObjectURL(maskUrl);
    }
  };

  const runMagicSelectPoint = async (
    event: PointerEvent<HTMLCanvasElement>,
  ) => {
    const target = findImageById(maskTargetId);

    if (!target || isGeneratingMask || isApplyingMagicTool) {
      setMagicEraserStatus('Start magic select on an image layer first.');
      return;
    }

    const click = canvasPointToImageClick(
      pointerToCanvasPoint(event),
      target,
      event.altKey ? 0 : 1,
    );

    if (!click) {
      setMagicEraserStatus('Click inside the selected image.');
      return;
    }

    const nextClicks = [...magicSelectClicks, click];
    setMagicSelectClicks(nextClicks);
    setIsGeneratingMask(true);
    setMagicEraserStatus(
      click[2] === 1
        ? 'Adding to selection with InteractiveSeg...'
        : 'Subtracting from selection with InteractiveSeg...',
    );

    try {
      const response = await fetch('/api/editor/magic-select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl: imageObjectToDataUrl(target),
          clicks: nextClicks,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Magic select failed.');
      }

      await drawRemoteMaskForImage(await response.blob(), target);
      setMagicEraserStatus('Mask ready. Refine, confirm, erase, or lift.');
    } catch (error) {
      setMagicEraserStatus(magicToolErrorMessage(error, 'Magic select failed.'));
    } finally {
      setIsGeneratingMask(false);
    }
  };

  const createMaskForImage = (image: FabricImage) => {
    const maskCanvas = maskCanvasRef.current;
    const bounds = image.getBoundingRect();
    const width = Math.max(1, Math.round(image.width ?? bounds.width));
    const height = Math.max(1, Math.round(image.height ?? bounds.height));
    const scratch = document.createElement('canvas');
    const context = scratch.getContext('2d');

    if (!maskCanvas || !context) {
      return { dataUrl: '', hasMask: false };
    }

    scratch.width = width;
    scratch.height = height;
    context.fillStyle = '#000000';
    context.fillRect(0, 0, width, height);
    context.drawImage(
      maskCanvas,
      bounds.left,
      bounds.top,
      bounds.width,
      bounds.height,
      0,
      0,
      width,
      height,
    );

    const imageData = context.getImageData(0, 0, width, height);
    let hasMask = false;

    for (let index = 0; index < imageData.data.length; index += 4) {
      const value = Math.max(
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
      );

      if (value > 16) {
        imageData.data[index] = 255;
        imageData.data[index + 1] = 255;
        imageData.data[index + 2] = 255;
        imageData.data[index + 3] = 255;
        hasMask = true;
      } else {
        imageData.data[index] = 0;
        imageData.data[index + 1] = 0;
        imageData.data[index + 2] = 0;
        imageData.data[index + 3] = 255;
      }
    }

    context.putImageData(imageData, 0, 0);

    return {
      dataUrl: scratch.toDataURL('image/png'),
      hasMask,
    };
  };

  const runMagicEraser = async () => {
    const canvas = canvasRef.current;
    const target = findImageById(maskTargetId);

    if (!canvas || !target || isInpainting) {
      setMagicEraserStatus('Start mask mode on an image layer first.');
      return;
    }

    if (Math.abs((target.angle ?? 0) % 360) > 0.1) {
      setMagicEraserStatus('Rotate the image back to 0 degrees before erasing.');
      return;
    }

    const mask = createMaskForImage(target);
    if (!mask.hasMask) {
      setMagicEraserStatus('Paint a mask over the area to erase first.');
      return;
    }

    setIsInpainting(true);
    setMagicEraserStatus('Sending mask to LaMa inpainting service...');

    try {
      const response = await fetch('/api/editor/inpaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl: imageObjectToDataUrl(target),
          maskDataUrl: mask.dataUrl,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Magic eraser failed.');
      }

      const resultDataUrl = await blobToDataUrl(await response.blob());
      const replacement = await FabricImage.fromURL(resultDataUrl);

      replacement.set({
        left: target.left,
        top: target.top,
        angle: target.angle,
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        flipX: target.flipX,
        flipY: target.flipY,
        opacity: target.opacity,
        name: `${target.get('name') ?? 'Image'} - magic erased`,
      });

      canvas.remove(target);
      canvas.add(replacement);
      canvas.setActiveObject(replacement);
      canvas.requestRenderAll();
      refreshLayers();
      clearMaskCanvas();
      setMaskTargetId(objectId(replacement));
      setIsMaskMode(false);
      setIsMagicSelectMode(false);
      setMagicSelectClicks([]);
      setHasReadyMask(false);
      setMagicEraserStatus('Magic eraser applied. The image layer was replaced.');
    } catch (error) {
      setMagicEraserStatus(magicToolErrorMessage(error, 'Magic eraser failed.'));
    } finally {
      setIsInpainting(false);
    }
  };

  const liftMagicObject = async (cleanOriginal: boolean) => {
    const canvas = canvasRef.current;
    const target = findImageById(maskTargetId);

    if (!canvas || !target || isLiftingObject || isInpainting) {
      setMagicEraserStatus('Start mask mode on an image layer first.');
      return;
    }

    if (Math.abs((target.angle ?? 0) % 360) > 0.1) {
      setMagicEraserStatus('Rotate the image back to 0 degrees before lifting.');
      return;
    }

    const mask = createMaskForImage(target);
    if (!mask.hasMask) {
      setMagicEraserStatus('Create a mask over the object to lift first.');
      return;
    }

    setIsLiftingObject(true);
    setMagicEraserStatus(
      cleanOriginal
        ? 'Creating object layer and cleaning original...'
        : 'Creating movable object layer...',
    );

    try {
      const sourceImageDataUrl = imageObjectToDataUrl(target);
      const objectResponse = await fetch('/api/editor/object-layer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageDataUrl: sourceImageDataUrl,
          maskDataUrl: mask.dataUrl,
        }),
      });

      if (!objectResponse.ok) {
        const payload = (await objectResponse.json()) as { error?: string };
        throw new Error(payload.error ?? 'Unable to create object layer.');
      }

      const payload = (await objectResponse.json()) as {
        objectDataUrl: string;
        bounds: {
          left: number;
          top: number;
          width: number;
          height: number;
        };
      };
      const objectLayer = await FabricImage.fromURL(payload.objectDataUrl);
      const baseName = target.get('name') ?? 'Image';

      objectLayer.set({
        left: (target.left ?? 0) + payload.bounds.left * (target.scaleX ?? 1),
        top: (target.top ?? 0) + payload.bounds.top * (target.scaleY ?? 1),
        scaleX: target.scaleX,
        scaleY: target.scaleY,
        flipX: target.flipX,
        flipY: target.flipY,
        opacity: target.opacity,
        name: `${baseName} - lifted object`,
      });

      if (cleanOriginal) {
        const inpaintResponse = await fetch('/api/editor/inpaint', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageDataUrl: sourceImageDataUrl,
            maskDataUrl: mask.dataUrl,
          }),
        });

        if (!inpaintResponse.ok) {
          const payload = (await inpaintResponse.json()) as { error?: string };
          throw new Error(payload.error ?? 'Unable to clean original image.');
        }

        const cleanedDataUrl = await blobToDataUrl(await inpaintResponse.blob());
        const cleanedLayer = await FabricImage.fromURL(cleanedDataUrl);
        const targetIndex = canvas.getObjects().indexOf(target);

        cleanedLayer.set({
          left: target.left,
          top: target.top,
          angle: target.angle,
          scaleX: target.scaleX,
          scaleY: target.scaleY,
          flipX: target.flipX,
          flipY: target.flipY,
          opacity: target.opacity,
          name: `${baseName} - object removed`,
        });

        canvas.remove(target);
        canvas.insertAt(targetIndex, cleanedLayer);
        setMaskTargetId(objectId(cleanedLayer));
      }

      canvas.add(objectLayer);
      canvas.setActiveObject(objectLayer);
      canvas.requestRenderAll();
      refreshLayers();
      clearMaskCanvas();
      setIsMaskMode(false);
      setIsMagicSelectMode(false);
      setMagicSelectClicks([]);
      setHasReadyMask(false);
      setMagicEraserStatus(
        cleanOriginal
          ? 'Object lifted into a movable layer and original was cleaned.'
          : 'Object lifted into a movable layer.',
      );
    } catch (error) {
      setMagicEraserStatus(magicToolErrorMessage(error, 'Unable to lift object.'));
    } finally {
      setIsLiftingObject(false);
    }
  };

  const applyBuiltInTemplate = (template: BuiltInTemplate) => {
    const canvas = canvasRef.current;
    const preset = CANVAS_PRESETS.find((item) => item.id === template.presetId);
    if (!canvas || !preset) return;

    setCanvasPreset(preset);
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.add(...template.build(brand));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
    refreshLayers();
  };

  const applyStoredTemplate = async (template: StoredTemplate) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preset = {
      id: `saved-${template.id}`,
      label: `${template.width} x ${template.height}`,
      width: template.width,
      height: template.height,
    };
    setCanvasPreset(preset);
    await canvas.loadFromJSON(JSON.stringify(template.json));
    canvas.backgroundColor = '#ffffff';
    canvas.requestRenderAll();
    refreshLayers();
  };

  const deleteStoredTemplate = (id: string) => {
    setSavedTemplates((current) => current.filter((template) => template.id !== id));
  };

  const applyBrandToCanvas = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.getObjects().forEach((object, index) => {
      if (object.type === 'textbox') {
        object.set({
          fill: index % 2 === 0 ? brand.primary : brand.accent,
          fontFamily: brand.font,
        });
      }

      if (object.type === 'rect' || object.type === 'circle') {
        object.set({
          fill: index % 2 === 0 ? brand.secondary : brand.accent,
        });
      }
    });

    if (brand.logoDataUrl) {
      const hasLogo = canvas
        .getObjects()
        .some((object) => object.get('name') === 'Brand Logo');
      if (!hasLogo) {
        await addLogoToCanvas(brand.logoDataUrl);
      }
    }

    canvas.requestRenderAll();
    refreshLayers();
  };

  return (
    <main className="min-h-screen bg-[#f4f6f8] text-[#171b1f]">
      <div className="grid min-h-screen grid-rows-[auto_1fr]">
        <header className="flex min-h-16 items-center justify-between border-b border-[#d9dee3] bg-white px-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[#17201f] text-white">
              <MousePointer2 className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight">
                Milestone 9 Editor
              </h1>
              <p className="text-xs font-medium text-[#66727d]">
                Fabric.js design tools with guided magic selection
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              className="editor-select min-w-40"
              value={
                CANVAS_PRESETS.some((preset) => preset.id === canvasSize.id)
                  ? canvasSize.id
                  : ''
              }
              onChange={(event) => {
                const preset = CANVAS_PRESETS.find(
                  (item) => item.id === event.target.value,
                );
                if (preset) setCanvasPreset(preset);
              }}
              title="Canvas preset"
            >
              {!CANVAS_PRESETS.some((preset) => preset.id === canvasSize.id) && (
                <option value="">{canvasSize.label}</option>
              )}
              {CANVAS_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            <input
              ref={jsonInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleJsonUpload}
            />
            <button
              className="editor-button"
              type="button"
              onClick={() => jsonInputRef.current?.click()}
              title="Load JSON"
            >
              <FileUp className="h-4 w-4" />
              <span>Load</span>
            </button>
            <button
              className="editor-button"
              type="button"
              onClick={saveJson}
              title="Save JSON"
            >
              <FileDown className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button
              className="editor-button"
              type="button"
              onClick={saveTemplate}
              title="Save template"
            >
              <Save className="h-4 w-4" />
              <span>Template</span>
            </button>
            <button
              className="editor-primary-button"
              type="button"
              onClick={exportPng}
              title="Export PNG"
            >
              <Download className="h-4 w-4" />
              <span>PNG</span>
            </button>
          </div>
        </header>

        <div className="grid min-h-0 grid-cols-[72px_280px_1fr_300px]">
          <aside className="flex flex-col items-center gap-2 border-r border-[#d9dee3] bg-white px-2 py-3">
              <input
                id="editor-image-upload"
                ref={imageInputRef}
                type="file"
                accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              className="editor-icon-button"
              type="button"
              onClick={() => imageInputRef.current?.click()}
              title="Upload image"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <button
              className="editor-icon-button"
              type="button"
              onClick={addText}
              title="Add text"
            >
              <Type className="h-5 w-5" />
            </button>
            <button
              className="editor-icon-button"
              type="button"
              onClick={addRectangle}
              title="Add rectangle"
            >
              <Square className="h-5 w-5" />
            </button>
            <button
              className="editor-icon-button"
              type="button"
              onClick={addCircle}
              title="Add circle"
            >
              <CircleIcon className="h-5 w-5" />
            </button>
            <div className="my-1 h-px w-10 bg-[#d9dee3]" />
            <button
              className="editor-icon-button"
              type="button"
              onClick={deleteSelected}
              title="Delete selected"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              className="editor-icon-button"
              type="button"
              onClick={clearCanvas}
              title="Clear canvas"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </aside>

          <aside className="min-h-0 overflow-auto border-r border-[#d9dee3] bg-white">
            <section className="border-b border-[#e3e7eb]">
              <div className="flex min-h-14 items-center gap-2 px-4">
                <LayoutTemplate className="h-4 w-4" />
                <h2 className="text-sm font-bold">Templates</h2>
              </div>
              <div className="space-y-2 px-3 pb-4">
                {builtInTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className="editor-panel-button"
                    onClick={() => applyBuiltInTemplate(template)}
                  >
                    <span className="font-bold">{template.name}</span>
                    <span className="text-xs text-[#74808a]">Built in</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex min-h-14 items-center gap-2 px-4">
                <Save className="h-4 w-4" />
                <h2 className="text-sm font-bold">Saved</h2>
              </div>
              <div className="space-y-2 px-3 pb-4">
                {savedTemplates.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#cfd6dd] p-3 text-sm font-medium text-[#66727d]">
                    Save a template from the top bar.
                  </div>
                ) : (
                  savedTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="rounded-md border border-[#dfe4e8] bg-white p-2"
                    >
                      <button
                        type="button"
                        className="w-full text-left text-sm font-bold"
                        onClick={() => applyStoredTemplate(template)}
                      >
                        {template.name}
                      </button>
                      <div className="mt-1 flex items-center justify-between text-xs text-[#74808a]">
                        <span>
                          {template.width} x {template.height}
                        </span>
                        <button
                          type="button"
                          className="font-bold text-[#b33a3a]"
                          onClick={() => deleteStoredTemplate(template.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>

          <section className="min-w-0 overflow-auto bg-[#e7ebef] p-8">
            <div className="mx-auto w-fit">
              <div className="relative">
                <div className="border border-[#c9d0d7] bg-white shadow-[0_20px_70px_rgba(30,40,50,0.18)]">
                  <canvas
                    ref={canvasElementRef}
                    className="block"
                    style={{
                      width: previewSize.width,
                      height: previewSize.height,
                    }}
                  />
                </div>
                <canvas
                  ref={maskCanvasRef}
                  className={`absolute left-0 top-0 block border border-transparent ${
                    isMaskMode || isMagicSelectMode
                      ? 'cursor-crosshair opacity-80'
                      : 'pointer-events-none opacity-0'
                  }`}
                  style={{
                    width: previewSize.width,
                    height: previewSize.height,
                    touchAction: 'none',
                  }}
                  onPointerDown={handleMaskPointerDown}
                  onPointerMove={handleMaskPointerMove}
                  onPointerUp={handleMaskPointerUp}
                  onPointerCancel={handleMaskPointerUp}
                  onPointerLeave={handleMaskPointerUp}
                />
              </div>
              <p className="mt-3 text-center text-xs font-bold text-[#66727d]">
                {canvasSize.width} x {canvasSize.height}
              </p>
            </div>
          </section>

          <aside className="min-h-0 overflow-auto border-l border-[#d9dee3] bg-white">
            <section className="border-b border-[#e3e7eb]">
              <div className="flex min-h-14 items-center gap-2 px-4">
                <Sparkles className="h-4 w-4" />
                <h2 className="text-sm font-bold">Image Tools</h2>
              </div>
              <div className="space-y-2 p-3">
                <button
                  type="button"
                  className="editor-primary-button w-full"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  <span>Upload Image</span>
                </button>
                <p className="border-b border-[#e3e7eb] pb-3 text-xs font-medium leading-5 text-[#66727d]">
                  {imageUploadStatus}
                </p>
                <div className="rounded-md border border-[#dfe4e8] bg-[#f7f9fa] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase text-[#66727d]">
                      Selection
                    </span>
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold ${
                        magicSelectionState === 'ready'
                          ? 'bg-[#d9f1e4] text-[#17633a]'
                          : magicSelectionState === 'selecting'
                            ? 'bg-[#dcecff] text-[#17508c]'
                            : magicSelectionState === 'applying'
                              ? 'bg-[#fff0cf] text-[#835300]'
                              : 'bg-[#e9edf1] text-[#66727d]'
                      }`}
                    >
                      {magicSelectionState === 'ready'
                        ? 'Ready'
                        : magicSelectionState === 'selecting'
                          ? 'Selecting'
                          : magicSelectionState === 'applying'
                            ? 'Applying'
                            : 'Empty'}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-[#66727d]">
                    <div className="rounded border border-[#dfe4e8] bg-white px-2 py-2">
                      Add {magicAddClicks}
                    </div>
                    <div className="rounded border border-[#dfe4e8] bg-white px-2 py-2">
                      Subtract {magicSubtractClicks}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="editor-button justify-center"
                    onClick={isMaskMode ? stopMagicMask : startMagicMask}
                    disabled={isApplyingMagicTool || isGeneratingMask}
                  >
                    {isMaskMode ? 'Pause Mask' : 'Mask Brush'}
                  </button>
                  <button
                    type="button"
                    className="editor-button justify-center"
                    onClick={isMagicSelectMode ? stopMagicMask : startMagicSelect}
                    disabled={isApplyingMagicTool || isGeneratingMask}
                  >
                    {isMagicSelectMode ? 'Pause Select' : 'Magic Select'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="editor-button justify-center"
                    onClick={resetMagicMask}
                    disabled={isApplyingMagicTool || isGeneratingMask || !hasReadyMask}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="editor-button justify-center"
                    onClick={cancelMagicSelection}
                    disabled={
                      isApplyingMagicTool ||
                      isGeneratingMask ||
                      (!hasReadyMask && !isMaskMode && !isMagicSelectMode)
                    }
                  >
                    Cancel
                  </button>
                </div>
                <label className="block text-xs font-bold text-[#66727d]">
                  Brush size
                  <input
                    className="mt-2 w-full accent-[#17201f]"
                    type="range"
                    min="12"
                    max="120"
                    step="4"
                    value={maskBrushSize}
                    onChange={(event) =>
                      setMaskBrushSize(Number(event.target.value))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="editor-button w-full justify-center"
                  onClick={confirmMagicSelection}
                  disabled={isApplyingMagicTool || isGeneratingMask || !hasReadyMask}
                >
                  Confirm Selection
                </button>
                <button
                  type="button"
                  className="editor-primary-button w-full"
                  onClick={runMagicEraser}
                  disabled={isApplyingMagicTool || isGeneratingMask || !hasReadyMask}
                >
                  {isInpainting
                    ? 'Erasing...'
                    : isGeneratingMask
                      ? 'Selecting...'
                      : 'Run Magic Eraser'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="editor-button justify-center"
                    onClick={() => liftMagicObject(false)}
                    disabled={isApplyingMagicTool || isGeneratingMask || !hasReadyMask}
                  >
                    {isLiftingObject ? 'Lifting...' : 'Lift Object'}
                  </button>
                  <button
                    type="button"
                    className="editor-button justify-center"
                    onClick={() => liftMagicObject(true)}
                    disabled={isApplyingMagicTool || isGeneratingMask || !hasReadyMask}
                  >
                    Lift + Clean
                  </button>
                </div>
                <p className="border-b border-[#e3e7eb] pb-3 text-xs font-medium leading-5 text-[#66727d]">
                  {magicEraserStatus}
                </p>
                <button
                  type="button"
                  className="editor-primary-button w-full"
                  onClick={removeSelectedBackground}
                  disabled={isRemovingBackground}
                >
                  {isRemovingBackground ? 'Removing...' : 'Remove Background'}
                </button>
                <p className="text-xs font-medium leading-5 text-[#66727d]">
                  {backgroundRemovalStatus}
                </p>
              </div>
            </section>

            <section className="border-b border-[#e3e7eb]">
              <div className="flex min-h-14 items-center gap-2 px-4">
                <Palette className="h-4 w-4" />
                <h2 className="text-sm font-bold">Brand Kit</h2>
              </div>
              <div className="space-y-3 p-3">
                <label className="editor-field">
                  <span>Primary</span>
                  <input
                    type="color"
                    value={brand.primary}
                    onChange={(event) =>
                      setBrand((current) => ({
                        ...current,
                        primary: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="editor-field">
                  <span>Secondary</span>
                  <input
                    type="color"
                    value={brand.secondary}
                    onChange={(event) =>
                      setBrand((current) => ({
                        ...current,
                        secondary: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="editor-field">
                  <span>Accent</span>
                  <input
                    type="color"
                    value={brand.accent}
                    onChange={(event) =>
                      setBrand((current) => ({
                        ...current,
                        accent: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="block text-xs font-bold text-[#66727d]">
                  Font
                  <select
                    className="editor-select mt-1 w-full"
                    value={brand.font}
                    onChange={(event) =>
                      setBrand((current) => ({
                        ...current,
                        font: event.target.value,
                      }))
                    }
                  >
                    <option value="Inter, Arial, sans-serif">Inter</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Courier New', monospace">Courier</option>
                  </select>
                </label>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  className="editor-button w-full"
                  onClick={() => logoInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  <span>Upload Logo</span>
                </button>
                <button
                  type="button"
                  className="editor-primary-button w-full"
                  onClick={applyBrandToCanvas}
                >
                  Apply Brand
                </button>
              </div>
            </section>

            <section className="border-b border-[#e3e7eb]">
              <div className="flex min-h-14 items-center gap-2 px-4">
                <Download className="h-4 w-4" />
                <h2 className="text-sm font-bold">Sharp Export</h2>
              </div>
              <div className="space-y-3 p-3">
                <label className="block text-xs font-bold text-[#66727d]">
                  Target size
                  <select
                    className="editor-select mt-1 w-full"
                    value={exportPresetId}
                    onChange={(event) => setExportPresetId(event.target.value)}
                  >
                    {CANVAS_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label} ({preset.width}x{preset.height})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-[#66727d]">
                  Format
                  <select
                    className="editor-select mt-1 w-full"
                    value={exportFormat}
                    onChange={(event) =>
                      setExportFormat(event.target.value as ExportFormat)
                    }
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="webp">WebP</option>
                  </select>
                </label>
                <button
                  type="button"
                  className="editor-primary-button w-full"
                  onClick={exportWithSharp}
                  disabled={isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export Final'}
                </button>
              </div>
            </section>

            <section>
              <div className="flex min-h-14 items-center gap-2 border-b border-[#e3e7eb] px-4">
                <Layers className="h-4 w-4" />
                <h2 className="text-sm font-bold">Layers</h2>
              </div>

              <div className="space-y-2 p-3">
                {layers.length === 0 ? (
                  <div className="rounded-md border border-dashed border-[#cfd6dd] p-4 text-sm font-medium text-[#66727d]">
                    Empty canvas
                  </div>
                ) : (
                  layers.map((layer) => (
                    <button
                      key={layer.id}
                      type="button"
                      onClick={() => selectLayer(layer.id)}
                      className={`flex min-h-11 w-full items-center justify-between rounded-md border px-3 text-left text-sm transition ${
                        selectedId === layer.id
                          ? 'border-[#17201f] bg-[#17201f] text-white'
                          : 'border-[#dfe4e8] bg-white text-[#232b33] hover:bg-[#f4f6f8]'
                      }`}
                    >
                      <span className="truncate font-semibold">
                        {layer.label}
                      </span>
                      <span
                        className={`ml-3 shrink-0 text-xs ${
                          selectedId === layer.id
                            ? 'text-white/70'
                            : 'text-[#74808a]'
                        }`}
                      >
                        {layer.type}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
