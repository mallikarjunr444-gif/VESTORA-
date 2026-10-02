/**
 * VESTORA — Shared Core Type Definitions
 * Contract definitions for product detection, pose tracking, garment pipeline,
 * temporal stabilization, rendering, and extension messaging.
 */

// ── 1. Product Detection Types (PRD Section 11) ──
export interface Product {
  id?: string;
  name: string;
  imageUrl: string;
  productUrl: string;
  pageUrl: string;
  category?: string;
  brand?: string;
  price?: string;
  currency?: string;
  color?: string;
  availableSizes?: string[];
  outOfStockSizes?: string[];
  secondaryImages?: string[];
  isFashion?: boolean;
  confidence?: number;
  detectionSource?: "json-ld" | "microdata" | "opengraph" | "dom-heuristic" | "context-menu" | "fallback";
}

// ── 2. Body Tracking & Pose Types (PRD Section 16) ──
export interface PoseLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface PoseResult {
  landmarks: PoseLandmark[];
  confidence: number;
  timestamp: number;
}

export interface PoseEngine {
  initialize(): Promise<void>;
  processFrame(frame: ImageBitmap | HTMLVideoElement): Promise<PoseResult>;
  dispose(): void;
}

// ── 3. Garment Representation Types (PRD Section 18) ──
export type GarmentCategory =
  | "T-Shirt"
  | "Shirt"
  | "Jacket"
  | "Hoodie"
  | "Dress"
  | "Top"
  | "Sweater"
  | "Pants"
  | "Skirt";

export interface GarmentLandmarks {
  collarLeft?: { x: number; y: number };
  collarRight?: { x: number; y: number };
  shoulderLeft?: { x: number; y: number };
  shoulderRight?: { x: number; y: number };
  hemLeft?: { x: number; y: number };
  hemRight?: { x: number; y: number };
}

export interface GarmentMetadata {
  brand?: string;
  sku?: string;
  originalPrice?: string;
  extractedAt?: number;
}

export interface Garment {
  id: string;
  imageUrl: string;
  category: GarmentCategory;
  mask?: ImageData;
  landmarks?: GarmentLandmarks;
  metadata?: GarmentMetadata;
}

// ── 4. Temporal Engine Types (PRD Section 21) ──
export interface MotionVector {
  dx: number;
  dy: number;
  angularVelocity?: number;
}

export interface GarmentTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface TemporalState {
  previousPose?: PoseResult;
  previousGarmentTransform?: GarmentTransform;
  previousMask?: ImageData;
  velocity?: MotionVector;
  confidence?: number;
}

// ── 5. Extension Settings & Messaging Types (PRD Sections 13, 24, 25) ──
export interface ExtensionSettings {
  cameraReady: boolean;
  performanceMode: "auto" | "high" | "balanced" | "low";
  privacyLocalOnly: boolean;
  autoDetectProducts: boolean;
  showOverlayButton: boolean;
  developerDebugMode: boolean;
}

export type ExtensionMessageType =
  | "VESTORA_PING"
  | "VESTORA_GET_SETTINGS"
  | "VESTORA_UPDATE_SETTINGS"
  | "VESTORA_PRODUCT_DETECTED"
  | "VESTORA_OPEN_TRYON"
  | "VESTORA_FETCH_IMAGE";

export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
}
