/**
 * Core types for the AI Generator module
 */

export interface Model {
  id: string;
  name: string;
  imageUrl: string;
  category: 'models' | 'styles';
}

export interface VideoObject {
  url: string;
  mode: 'draft' | 'advanced';
  enhancedPrompt: string | null;
  advancedPrompt: string | null;
  error: string | null;
  timestamp: number;
}

export interface Generation {
  id: string;
  prompt: string;
  enhancedPrompt: string | null;
  imageUrls: string[];
  videos: VideoObject[];
  processingVideoIndex: number | null;
  processingMode: 'draft' | 'advanced' | null;
  selectedImageIndex: number | null;
}

export interface DebugInfo {
  rawResponse: string;
  parsedResponse: any;
  imageUrls: string[];
  enhancedPrompt: string | null;
  error: string | null;
  webhookResponses?: any[];
}

export interface LoadingGeneration {
  id: string;
  prompt: string;
}

export interface VideoGenerationModal {
  show: boolean;
  generationId: string;
  imageUrl: string;
  imageIndex: number;
}

export interface FullscreenMedia {
  type: 'image' | 'video';
  url: string;
  generationId?: string;
  videoId?: number;
}

export interface HoveredImage {
  generationId: string;
  imageIndex: number;
}

export type VideoMode = 'draft' | 'advanced';

export interface VideoGenerationRequest {
  imageURL: string;
  mode?: VideoMode;
}

export interface ImageGenerationRequest {
  prompt: string;
  model?: string;
}

export interface VideoPollingData {
  request_id: string;
  content?: string;
  status?: string;
}
