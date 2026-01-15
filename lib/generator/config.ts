/**
 * Configuration for the AI Generator module
 */

import type { Model } from './types';

/**
 * Webhook URLs for different operations
 */
export const WEBHOOK_URLS = {
  // Image generation webhooks
  IMAGE_GENERATION: {
    DEFAULT: 'https://humanprompt.app.n8n.cloud/webhook/eff83ff9-6f5e-4786-9a2c-3d15ca5fc4ed',
    FIONA: 'https://humanprompt.app.n8n.cloud/webhook/fd13245b-3136-40de-82cc-8d220a3758c4',
    CAMILLA: 'https://humanprompt.app.n8n.cloud/webhook/9cd5b4aa-96a3-44d7-afdb-3f5f76cea56a',
    CINEMATIC: 'https://humanprompt.app.n8n.cloud/webhook/09b186fb-af85-4632-bed9-88381b766b51',
    SKETCH: 'https://humanprompt.app.n8n.cloud/webhook/b92deb2e-a2af-4c7e-a59e-aba30d7f1a8b',
  },

  // Video generation webhooks
  VIDEO_GENERATION: {
    DRAFT: 'https://humanprompt.app.n8n.cloud/webhook/241fd9df-0002-4708-ad60-b446e59feea7',
    ADVANCED: 'https://humanprompt.app.n8n.cloud/webhook/a64ecae2-2790-4f39-9134-07c20e0bf6a8',
  },

  // Video polling webhooks (for advanced mode)
  VIDEO_POLLING: {
    STATUS_CHECK: 'https://humanprompt.app.n8n.cloud/webhook/699f1cc7-7f9e-4008-aa82-e01a683fb38d',
    FINAL: 'https://humanprompt.app.n8n.cloud/webhook/82328e89-b6f3-4549-a375-d3d7e9f1f4d4',
  },
} as const;

/**
 * Loading animation video URL
 */
export const LOADING_VIDEO_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Generating%20Video-JTTbLaCYi9LbW4EROlqmzzA2XpVTfq.mp4';

/**
 * Available models and styles
 */
export const MODELS: Model[] = [
  {
    id: 'fiona',
    name: 'Fiona',
    imageUrl: '/images/fiona-model.jpeg',
    category: 'models',
  },
  {
    id: 'camilla',
    name: 'Camilla',
    imageUrl:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fictional_Model_Camilla_-_FLUX_e000010_01_20250216201026-PzIYuIP2XHSub7G5Fgd9eTs2BTAeis.jpeg',
    category: 'models',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Solo Tone',
    imageUrl:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Z.jpg-dpvX4dqgGQks8OOB8NZVQZUTMAcTnh.jpeg',
    category: 'styles',
  },
  {
    id: 'sketch',
    name: 'Simple Sketch',
    imageUrl:
      'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Simple%20Sketch.jpg-LTc3YSLW1FhYn5scu3oTtU4o6NCugm.jpeg',
    category: 'styles',
  },
];

/**
 * Timeout configurations (in milliseconds)
 */
export const TIMEOUTS = {
  DRAFT_VIDEO: 3 * 60 * 1000, // 3 minutes
  ADVANCED_VIDEO_MAX_POLLING: 10 * 60 * 1000, // 10 minutes
  ADVANCED_VIDEO_POLL_INTERVAL: 30 * 1000, // 30 seconds
  GENERATION_ANIMATION: 500, // 500ms for transition animation
} as const;

/**
 * Get the appropriate image generation webhook URL based on model selection
 */
export function getImageGenerationWebhookUrl(
  modelsEnabled: boolean,
  selectedModel: string
): string {
  if (!modelsEnabled) {
    return WEBHOOK_URLS.IMAGE_GENERATION.DEFAULT;
  }

  const modelMap: Record<string, string> = {
    fiona: WEBHOOK_URLS.IMAGE_GENERATION.FIONA,
    camilla: WEBHOOK_URLS.IMAGE_GENERATION.CAMILLA,
    cinematic: WEBHOOK_URLS.IMAGE_GENERATION.CINEMATIC,
    sketch: WEBHOOK_URLS.IMAGE_GENERATION.SKETCH,
  };

  return modelMap[selectedModel] || WEBHOOK_URLS.IMAGE_GENERATION.DEFAULT;
}

/**
 * Get the appropriate video generation webhook URL based on mode
 */
export function getVideoGenerationWebhookUrl(mode: 'draft' | 'advanced'): string {
  return mode === 'draft'
    ? WEBHOOK_URLS.VIDEO_GENERATION.DRAFT
    : WEBHOOK_URLS.VIDEO_GENERATION.ADVANCED;
}
