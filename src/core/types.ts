export type EngineName = 'nanobanana' | 'flux';
export interface GenerationRequest {
  engine: EngineName;
  prompt: string;
  negative?: string;
  seed?: number | null;
  strength?: number;
  refImage?: ArrayBuffer | null;
  refWeight?: number;
  region?: { x: number; y: number; width: number; height: number } | null;
}
export interface GenerationResult {
  image: ArrayBuffer;
  meta: Record<string, any>;
}