/**
 * Service for image generation API calls
 */

import { getImageGenerationWebhookUrl } from '../config';
import { extractTwoUrlsAndPrompt, extractUrlsFromText } from '../utils/extractors';
import type { ImageGenerationRequest } from '../types';

export interface ImageGenerationResult {
  imageUrls: string[];
  enhancedPrompt: string | null;
  rawResponse: string;
  parsedResponse: any;
  error: string | null;
}

/**
 * Generate images from a prompt
 * @param request - The image generation request
 * @param modelsEnabled - Whether models are enabled
 * @param selectedModel - The selected model ID
 * @returns Image generation result
 */
export async function generateImages(
  request: ImageGenerationRequest,
  modelsEnabled: boolean,
  selectedModel: string
): Promise<ImageGenerationResult> {
  const webhookUrl = getImageGenerationWebhookUrl(modelsEnabled, selectedModel);

  console.log(`Sending prompt to webhook: ${webhookUrl}`);
  console.log(`Models enabled: ${modelsEnabled}, Selected model: ${selectedModel}`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.prompt,
        model: selectedModel,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send prompt: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
    console.log('Raw webhook response received');

    let imageUrls: string[] = [];
    let enhancedPrompt: string | null = null;
    let parsedData: any = null;

    try {
      // Parse the response as JSON
      parsedData = JSON.parse(responseText);
      console.log('Successfully parsed response as JSON');

      // Use the specialized extraction function
      const extracted = extractTwoUrlsAndPrompt(parsedData);
      imageUrls = extracted.imageUrls;
      enhancedPrompt = extracted.enhancedPrompt;

      console.log(`Extracted ${imageUrls.length} image URLs from response`);
      console.log(
        enhancedPrompt
          ? 'Extracted enhanced prompt from response'
          : 'No enhanced prompt found in response'
      );
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.log(`Failed to parse response: ${errorMessage}`);

      // Try to extract URLs directly from the response text if it's not valid JSON
      if (responseText.includes('http')) {
        imageUrls = extractUrlsFromText(responseText);
        console.log(`Extracted ${imageUrls.length} image URLs directly from response text`);
      }
    }

    // Use placeholder image as fallback if no images were found
    console.log(`Final imageUrls array length: ${imageUrls.length}`);

    if (imageUrls.length === 0) {
      console.log(`No images found in the response, using placeholder`);
      imageUrls = ['/placeholder.svg?key=no-images-found'];
    } else {
      console.log(`Using ${imageUrls.length} extracted image URL(s) directly`);
    }

    return {
      imageUrls,
      enhancedPrompt,
      rawResponse: responseText,
      parsedResponse: parsedData,
      error: null,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error sending prompt:', errorMessage);

    return {
      imageUrls: [],
      enhancedPrompt: null,
      rawResponse: '',
      parsedResponse: null,
      error: `Error sending prompt: ${errorMessage}`,
    };
  }
}
