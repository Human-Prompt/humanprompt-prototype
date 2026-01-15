/**
 * Service for video generation API calls
 */

import {
  getVideoGenerationWebhookUrl,
  WEBHOOK_URLS,
  TIMEOUTS,
} from '../config';
import { extractVideoUrl, extractEnhancedPrompt, extractUrlsFromText } from '../utils/extractors';
import type { VideoMode, VideoPollingData } from '../types';

export interface VideoGenerationResult {
  videoUrl: string | null;
  enhancedPrompt: string | null;
  advancedPrompt: string | null;
  error: string | null;
  webhookResponses?: any[];
}

export interface VideoGenerationCallbacks {
  onProgress?: (message: string) => void;
  onPollingStart?: (requestId: string) => void;
  onPollingUpdate?: (status: string) => void;
}

/**
 * Generate a video from an image in draft mode
 * @param imageUrl - The URL of the image to convert to video
 * @param enhancedPrompt - The enhanced prompt from image generation
 * @param callbacks - Optional callbacks for progress updates
 * @returns Video generation result
 */
export async function generateDraftVideo(
  imageUrl: string,
  enhancedPrompt: string | null,
  callbacks?: VideoGenerationCallbacks
): Promise<VideoGenerationResult> {
  const webhookUrl = getVideoGenerationWebhookUrl('draft');
  const webhookResponses: any[] = [];

  console.log(`Sending request to generate video in draft mode from image:`, imageUrl);
  callbacks?.onProgress?.('Sending request to generate draft video...');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    console.log(`Request timed out after ${TIMEOUTS.DRAFT_VIDEO / 60000} minutes`);
  }, TIMEOUTS.DRAFT_VIDEO);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageURL: imageUrl, mode: 'draft' }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Server returned error: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Draft video generation raw response:', responseText);
    webhookResponses.push({ type: 'draft_video', response: responseText });

    let videoUrl: string | null = null;
    let videoEnhancedPrompt: string | null = null;

    try {
      const parsedData = JSON.parse(responseText);
      console.log('Draft video generation response (parsed):', parsedData);

      videoUrl = extractVideoUrl(parsedData);
      videoEnhancedPrompt = extractEnhancedPrompt(parsedData);

      console.log('Extracted video URL:', videoUrl);
      console.log('Extracted video enhanced prompt:', videoEnhancedPrompt);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);

      // If it's not JSON, check if the raw text is a URL
      if (responseText.trim().startsWith('http')) {
        videoUrl = responseText.trim();
        console.log('Using raw response as video URL:', videoUrl);
      } else {
        // Try to extract URL from the text using regex
        const urls = extractUrlsFromText(responseText);
        if (urls.length > 0) {
          videoUrl = urls[0];
          console.log('Extracted video URL from text using regex:', videoUrl);
        }
      }
    }

    if (!videoUrl) {
      console.warn('Draft mode: No video URL found in response');
      return {
        videoUrl: null,
        enhancedPrompt: null,
        advancedPrompt: null,
        error: 'No video URL received from server',
        webhookResponses,
      };
    }

    return {
      videoUrl,
      enhancedPrompt: videoEnhancedPrompt || enhancedPrompt,
      advancedPrompt: null,
      error: null,
      webhookResponses,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      console.error(`Draft mode: Request timed out after ${TIMEOUTS.DRAFT_VIDEO / 60000} minutes`);
      return {
        videoUrl: null,
        enhancedPrompt: null,
        advancedPrompt: null,
        error: 'Video generation is taking longer than expected. Please check back later.',
        webhookResponses,
      };
    }

    console.error('Draft mode: Error sending image URL for video generation:', error);
    return {
      videoUrl: null,
      enhancedPrompt: null,
      advancedPrompt: null,
      error: 'An error occurred while trying to generate the video.',
      webhookResponses,
    };
  }
}

/**
 * Poll for video generation status
 * @param pollingData - The polling data from initial request
 * @returns Status check result
 */
async function pollStatusCheck(pollingData: VideoPollingData): Promise<{
  isComplete: boolean;
  videoUrl: string | null;
  error: string | null;
  response?: any;
}> {
  console.log(`Polling for request_id: ${pollingData.request_id}`);

  try {
    const statusCheckWebhookUrl = WEBHOOK_URLS.VIDEO_POLLING.STATUS_CHECK;
    const statusResponse = await fetch(statusCheckWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pollingData),
    });

    if (!statusResponse.ok) {
      console.error('Failed to send to Status Check webhook. Status:', statusResponse.status);
      return { isComplete: false, videoUrl: null, error: null };
    }

    const statusText = await statusResponse.text();
    console.log('Status Check webhook response:', statusText);

    try {
      const statusData = JSON.parse(statusText);
      console.log('Parsed status check response:', statusData);

      // Check if the video is ready
      if (statusData.status === 'COMPLETED') {
        console.log('Video generation completed! Sending to final webhook');

        // Send to the final webhook to get the video URL
        const finalWebhookUrl = WEBHOOK_URLS.VIDEO_POLLING.FINAL;
        const finalResponse = await fetch(finalWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(pollingData),
        });

        if (!finalResponse.ok) {
          console.error('Failed to send to final webhook. Status:', finalResponse.status);
          return {
            isComplete: true,
            videoUrl: null,
            error: `Final webhook returned an error: ${finalResponse.status}`,
          };
        }

        const finalResponseText = await finalResponse.text();
        console.log('Final webhook response:', finalResponseText);

        try {
          const finalJsonResponse = JSON.parse(finalResponseText);
          console.log('Final webhook JSON response:', finalJsonResponse);

          const videoUrl = extractVideoUrl(finalJsonResponse);

          if (videoUrl) {
            console.log('Extracted video URL from final webhook response:', videoUrl);
            return { isComplete: true, videoUrl, error: null, response: finalJsonResponse };
          } else {
            console.warn('No video URL found in final webhook response');
            return {
              isComplete: true,
              videoUrl: null,
              error: 'No video URL received from final webhook',
            };
          }
        } catch (e) {
          console.log('Final webhook response is not JSON');

          // Check if the raw response might be a URL
          if (finalResponseText.trim().startsWith('http')) {
            return {
              isComplete: true,
              videoUrl: finalResponseText.trim(),
              error: null,
            };
          } else {
            return {
              isComplete: true,
              videoUrl: null,
              error: 'Failed to process final webhook response',
            };
          }
        }
      } else {
        console.log('Video generation still in progress, will check again in 30 seconds');
        return { isComplete: false, videoUrl: null, error: null };
      }
    } catch (e) {
      console.log('Status Check webhook response is not JSON, will continue polling');
      return { isComplete: false, videoUrl: null, error: null };
    }
  } catch (error) {
    console.error('Error sending to Status Check webhook:', error);
    return { isComplete: false, videoUrl: null, error: null };
  }
}

/**
 * Start polling for video generation completion
 * @param pollingData - The polling data from initial request
 * @param callbacks - Optional callbacks for progress updates
 * @returns Promise that resolves when video is ready or times out
 */
async function startPollingProcess(
  pollingData: VideoPollingData,
  callbacks?: VideoGenerationCallbacks
): Promise<{ videoUrl: string | null; error: string | null; response?: any }> {
  const startTime = Date.now();
  const maxPollingTime = TIMEOUTS.ADVANCED_VIDEO_MAX_POLLING;
  const pollInterval = TIMEOUTS.ADVANCED_VIDEO_POLL_INTERVAL;

  callbacks?.onPollingStart?.(pollingData.request_id);

  return new Promise((resolve) => {
    const poll = async () => {
      // Check if we've exceeded the maximum polling time
      if (Date.now() - startTime > maxPollingTime) {
        console.log('Exceeded maximum polling time of 10 minutes');
        resolve({
          videoUrl: null,
          error: 'Video generation timed out after 10 minutes',
        });
        return;
      }

      const result = await pollStatusCheck(pollingData);

      if (result.isComplete) {
        resolve({
          videoUrl: result.videoUrl,
          error: result.error,
          response: result.response,
        });
      } else {
        // Schedule next poll
        console.log(`Scheduling next status check in ${pollInterval / 1000} seconds`);
        callbacks?.onPollingUpdate?.('checking');
        setTimeout(poll, pollInterval);
      }
    };

    // Start the first poll immediately
    poll();
  });
}

/**
 * Generate a video from an image in advanced mode
 * Uses polling to check for completion
 * @param imageUrl - The URL of the image to convert to video
 * @param enhancedPrompt - The enhanced prompt from image generation
 * @param callbacks - Optional callbacks for progress updates
 * @returns Video generation result
 */
export async function generateAdvancedVideo(
  imageUrl: string,
  enhancedPrompt: string | null,
  callbacks?: VideoGenerationCallbacks
): Promise<VideoGenerationResult> {
  const webhookUrl = getVideoGenerationWebhookUrl('advanced');
  const webhookResponses: any[] = [];

  console.log('Sending request to advanced video generation webhook');
  callbacks?.onProgress?.('Initiating advanced video generation...');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageURL: imageUrl }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('Advanced video generation response:', responseText);
    webhookResponses.push({ type: 'advanced_init', response: responseText });

    try {
      const parsedData = JSON.parse(responseText);
      console.log('Parsed advanced video response:', parsedData);

      if (!parsedData.request_id) {
        console.error('No request_id found in advanced video response');
        return {
          videoUrl: null,
          enhancedPrompt: null,
          advancedPrompt: null,
          error: 'Invalid response from server: missing request_id',
          webhookResponses,
        };
      }

      // Extract the content (prompt used) from the response
      const advancedPrompt = parsedData.content || null;
      console.log(
        `Received request_id: ${parsedData.request_id} and content: ${advancedPrompt} for advanced video generation`
      );

      callbacks?.onProgress?.(`Polling for video completion (request: ${parsedData.request_id})...`);

      // Start the polling process
      const pollingResult = await startPollingProcess(parsedData, callbacks);

      if (pollingResult.response) {
        webhookResponses.push({ type: 'final_webhook', response: pollingResult.response });
      }

      return {
        videoUrl: pollingResult.videoUrl,
        enhancedPrompt: enhancedPrompt,
        advancedPrompt: advancedPrompt,
        error: pollingResult.error,
        webhookResponses,
      };
    } catch (error) {
      console.error('Error parsing advanced video response:', error);
      return {
        videoUrl: null,
        enhancedPrompt: null,
        advancedPrompt: null,
        error: 'Failed to parse server response',
        webhookResponses,
      };
    }
  } catch (error) {
    console.error('Error during advanced video generation:', error);
    return {
      videoUrl: null,
      enhancedPrompt: null,
      advancedPrompt: null,
      error: 'Network error during video generation',
      webhookResponses,
    };
  }
}

/**
 * Generate a video from an image
 * Automatically uses the appropriate mode (draft or advanced)
 * @param imageUrl - The URL of the image to convert to video
 * @param mode - The video generation mode
 * @param enhancedPrompt - The enhanced prompt from image generation
 * @param callbacks - Optional callbacks for progress updates
 * @returns Video generation result
 */
export async function generateVideo(
  imageUrl: string,
  mode: VideoMode,
  enhancedPrompt: string | null,
  callbacks?: VideoGenerationCallbacks
): Promise<VideoGenerationResult> {
  if (mode === 'draft') {
    return generateDraftVideo(imageUrl, enhancedPrompt, callbacks);
  } else {
    return generateAdvancedVideo(imageUrl, enhancedPrompt, callbacks);
  }
}
