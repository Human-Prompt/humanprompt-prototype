/**
 * Main hook for managing generator state and operations
 */

import { useState, useCallback } from 'react';
import { generateImages } from '../services/imageService';
import { generateVideo } from '../services/videoService';
import { TIMEOUTS } from '../config';
import type {
  Generation,
  DebugInfo,
  LoadingGeneration,
  VideoMode,
  VideoObject,
} from '../types';

export interface UseGeneratorOptions {
  onError?: (error: string) => void;
  onSuccess?: (generation: Generation) => void;
}

export function useGenerator(options?: UseGeneratorOptions) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingGeneration, setLoadingGeneration] = useState<LoadingGeneration | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  /**
   * Generate images from a prompt
   */
  const handleGenerateImages = useCallback(
    async (prompt: string, modelsEnabled: boolean, selectedModel: string) => {
      if (!prompt.trim()) return;

      // Reset debug info
      setDebugInfo(null);

      // Start the transition animation and show loading state
      setIsTransitioning(true);
      setIsLoading(true);

      // Create a temporary loading generation
      const tempId = `loading_${Date.now()}`;
      setLoadingGeneration({
        id: tempId,
        prompt: prompt,
      });

      // Wait for animation to complete before proceeding
      setTimeout(async () => {
        try {
          const result = await generateImages(
            { prompt },
            modelsEnabled,
            selectedModel
          );

          // Update debug info
          if (result.error || result.rawResponse) {
            setDebugInfo({
              rawResponse: result.rawResponse,
              parsedResponse: result.parsedResponse,
              imageUrls: result.imageUrls,
              enhancedPrompt: result.enhancedPrompt,
              error: result.error,
            });
          }

          if (result.error) {
            options?.onError?.(result.error);
            return;
          }

          // Create a new generation object
          const newGeneration: Generation = {
            id: `gen_${Date.now()}`,
            prompt: prompt,
            enhancedPrompt: result.enhancedPrompt,
            imageUrls: result.imageUrls,
            videos: [],
            processingVideoIndex: null,
            processingMode: null,
            selectedImageIndex: null,
          };

          // Add the new generation to the array
          setGenerations((prev) => [...prev, newGeneration]);
          options?.onSuccess?.(newGeneration);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error generating images:', errorMessage);
          options?.onError?.(errorMessage);
        } finally {
          setIsLoading(false);
          setIsTransitioning(false);
          setLoadingGeneration(null);
        }
      }, TIMEOUTS.GENERATION_ANIMATION);
    },
    [options]
  );

  /**
   * Generate a video from an image
   */
  const handleGenerateVideo = useCallback(
    async (
      generationId: string,
      imageUrl: string,
      imageIndex: number,
      mode: VideoMode
    ) => {
      // Get the current generation to access its enhanced prompt
      const generation = generations.find((gen) => gen.id === generationId);
      if (!generation) return;

      const enhancedPrompt = generation.enhancedPrompt || null;

      // Update the generation's processing state
      setGenerations((prev) =>
        prev.map((gen) => {
          if (gen.id === generationId) {
            return {
              ...gen,
              processingVideoIndex: imageIndex,
              processingMode: mode,
              selectedImageIndex: imageIndex,
            };
          }
          return gen;
        })
      );

      try {
        const result = await generateVideo(imageUrl, mode, enhancedPrompt, {
          onProgress: (message) => {
            console.log('Video generation progress:', message);
          },
          onPollingStart: (requestId) => {
            console.log('Started polling for request:', requestId);
          },
          onPollingUpdate: (status) => {
            console.log('Polling status:', status);
          },
        });

        // Update debug info with webhook responses
        if (result.webhookResponses) {
          setDebugInfo((prev) => ({
            ...(prev || {
              rawResponse: '',
              parsedResponse: null,
              imageUrls: [],
              enhancedPrompt: null,
              error: null,
            }),
            webhookResponses: [
              ...(prev?.webhookResponses || []),
              ...result.webhookResponses,
            ],
          }));
        }

        // Create the video object
        const newVideo: VideoObject = {
          url: result.videoUrl || '',
          mode: mode,
          enhancedPrompt: result.enhancedPrompt,
          advancedPrompt: result.advancedPrompt,
          error: result.error,
          timestamp: Date.now(),
        };

        // Add the new video to the generation's videos array
        setGenerations((prev) =>
          prev.map((gen) => {
            if (gen.id === generationId) {
              return {
                ...gen,
                videos: [...gen.videos, newVideo],
                processingVideoIndex: null,
                processingMode: null,
              };
            }
            return gen;
          })
        );

        if (result.error) {
          options?.onError?.(result.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error generating video:', errorMessage);

        // Add an error video
        const errorVideo: VideoObject = {
          url: '',
          mode: mode,
          enhancedPrompt: null,
          advancedPrompt: null,
          error: 'An error occurred while trying to generate the video.',
          timestamp: Date.now(),
        };

        setGenerations((prev) =>
          prev.map((gen) => {
            if (gen.id === generationId) {
              return {
                ...gen,
                videos: [...gen.videos, errorVideo],
                processingVideoIndex: null,
                processingMode: null,
              };
            }
            return gen;
          })
        );

        options?.onError?.(errorMessage);
      }
    },
    [generations, options]
  );

  /**
   * Clear all generations
   */
  const clearGenerations = useCallback(() => {
    setGenerations([]);
  }, []);

  /**
   * Remove a specific generation
   */
  const removeGeneration = useCallback((generationId: string) => {
    setGenerations((prev) => prev.filter((gen) => gen.id !== generationId));
  }, []);

  return {
    // State
    generations,
    isLoading,
    isTransitioning,
    loadingGeneration,
    debugInfo,

    // Actions
    generateImages: handleGenerateImages,
    generateVideo: handleGenerateVideo,
    clearGenerations,
    removeGeneration,

    // Debug
    setDebugInfo,
  };
}
