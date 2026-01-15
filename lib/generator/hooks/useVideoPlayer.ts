/**
 * Hook for managing video player state
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Generation } from '../types';

export interface VideoRef {
  [generationId: string]: {
    [videoIndex: number]: HTMLVideoElement | null;
  };
}

export function useVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const videoRefs = useRef<VideoRef>({});

  /**
   * Toggle play/pause for a video
   */
  const togglePlayPause = useCallback(
    (generationId: string, videoIndex: number) => {
      const videoKey = `${generationId}-${videoIndex}`;

      // Initialize videoRefs for this generation if it doesn't exist
      if (!videoRefs.current[generationId]) {
        videoRefs.current[generationId] = {};
      }

      const videoRef = videoRefs.current[generationId][videoIndex];
      if (!videoRef) return;

      if (isPlaying[videoKey]) {
        videoRef.pause();
      } else {
        videoRef.play().catch((error) => {
          console.error('Error playing video:', error);
          throw error;
        });
      }

      setIsPlaying((prev) => ({
        ...prev,
        [videoKey]: !prev[videoKey],
      }));
    },
    [isPlaying]
  );

  /**
   * Set video reference
   */
  const setVideoRef = useCallback(
    (generationId: string, videoIndex: number, element: HTMLVideoElement | null) => {
      if (!videoRefs.current[generationId]) {
        videoRefs.current[generationId] = {};
      }
      videoRefs.current[generationId][videoIndex] = element;
    },
    []
  );

  /**
   * Handle video play event
   */
  const handleVideoPlay = useCallback((generationId: string, videoIndex: number) => {
    const videoKey = `${generationId}-${videoIndex}`;
    setIsPlaying((prev) => ({ ...prev, [videoKey]: true }));
  }, []);

  /**
   * Handle video pause event
   */
  const handleVideoPause = useCallback((generationId: string, videoIndex: number) => {
    const videoKey = `${generationId}-${videoIndex}`;
    setIsPlaying((prev) => ({ ...prev, [videoKey]: false }));
  }, []);

  /**
   * Handle video ended event
   */
  const handleVideoEnded = useCallback((generationId: string, videoIndex: number) => {
    const videoKey = `${generationId}-${videoIndex}`;
    setIsPlaying((prev) => ({ ...prev, [videoKey]: false }));
  }, []);

  /**
   * Check if a video is playing
   */
  const isVideoPlaying = useCallback(
    (generationId: string, videoIndex: number) => {
      const videoKey = `${generationId}-${videoIndex}`;
      return isPlaying[videoKey] || false;
    },
    [isPlaying]
  );

  /**
   * Get video element
   */
  const getVideoElement = useCallback(
    (generationId: string, videoIndex: number): HTMLVideoElement | null => {
      return videoRefs.current[generationId]?.[videoIndex] || null;
    },
    []
  );

  return {
    isPlaying,
    videoRefs,
    togglePlayPause,
    setVideoRef,
    handleVideoPlay,
    handleVideoPause,
    handleVideoEnded,
    isVideoPlaying,
    getVideoElement,
  };
}

/**
 * Hook for managing fullscreen video player
 */
export function useFullscreenVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }

    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const setVideoElement = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Sync video element state when it changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(console.error);
    } else {
      video.pause();
    }
  }, [isPlaying]);

  return {
    isPlaying,
    videoRef,
    togglePlayPause,
    setVideoElement,
    handlePlay,
    handlePause,
    handleEnded,
  };
}
