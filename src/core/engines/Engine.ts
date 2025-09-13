import { GenerationRequest, GenerationResult } from '../types';
export interface Engine {
  name: string;
  generate(req: GenerationRequest): Promise<GenerationResult>;
}