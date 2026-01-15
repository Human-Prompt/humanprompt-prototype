/**
 * Example usage of the AI Generator module
 *
 * This file demonstrates how to use the generator module in a React component.
 * Copy and adapt this code for your own application.
 */

'use client';

import React, { useState } from 'react';
import {
  useGenerator,
  useVideoPlayer,
  MODELS,
  downloadImage,
  downloadVideo,
  type Generation,
  type VideoMode,
} from '@/lib/generator';

export default function GeneratorExample() {
  // State for UI controls
  const [prompt, setPrompt] = useState('');
  const [modelsEnabled, setModelsEnabled] = useState(false);
  const [selectedModel, setSelectedModel] = useState('fiona');
  const [debugMode, setDebugMode] = useState(false);
  const [videoModeModal, setVideoModeModal] = useState<{
    generationId: string;
    imageUrl: string;
    imageIndex: number;
  } | null>(null);

  // Generator hook
  const {
    generations,
    isLoading,
    loadingGeneration,
    debugInfo,
    generateImages,
    generateVideo,
    clearGenerations,
  } = useGenerator({
    onError: (error) => {
      console.error('Generator error:', error);
      alert(error);
    },
    onSuccess: (generation) => {
      console.log('Generation complete:', generation);
    },
  });

  // Video player hook
  const {
    togglePlayPause,
    setVideoRef,
    isVideoPlaying,
    handleVideoPlay,
    handleVideoPause,
    handleVideoEnded,
  } = useVideoPlayer();

  // Handlers
  const handleGenerateClick = async () => {
    if (!prompt.trim()) return;
    await generateImages(prompt, modelsEnabled, selectedModel);
    setPrompt('');
  };

  const handleImageClick = (
    generationId: string,
    imageUrl: string,
    imageIndex: number
  ) => {
    setVideoModeModal({ generationId, imageUrl, imageIndex });
  };

  const handleVideoGeneration = async (mode: VideoMode) => {
    if (!videoModeModal) return;

    const { generationId, imageUrl, imageIndex } = videoModeModal;
    setVideoModeModal(null);

    await generateVideo(generationId, imageUrl, imageIndex, mode);
  };

  const handleDownloadImage = async (url: string, index: number) => {
    try {
      await downloadImage(url, index);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDownloadVideo = async (
    generationId: string,
    videoIndex: number
  ) => {
    const generation = generations.find((g) => g.id === generationId);
    if (!generation?.videos[videoIndex]) return;

    try {
      await downloadVideo(
        generation.videos[videoIndex].url,
        generationId,
        videoIndex
      );
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold mb-4">AI Generator Example</h1>
        <p className="text-gray-400">
          Generate images and videos from text prompts
        </p>
      </div>

      {/* Input Section */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <textarea
            className="w-full bg-gray-700 rounded-lg p-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            placeholder="What would you like to generate?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGenerateClick}
                disabled={isLoading || !prompt.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Generating...' : 'Generate'}
              </button>

              <button
                onClick={clearGenerations}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modelsEnabled}
                  onChange={(e) => setModelsEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Enable Models</span>
              </label>

              <button
                onClick={() => setDebugMode(!debugMode)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                {debugMode ? 'Hide' : 'Show'} Debug
              </button>
            </div>
          </div>

          {/* Model Selection */}
          {modelsEnabled && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Select Model/Style:</h3>
              <div className="grid grid-cols-4 gap-4">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedModel === model.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="aspect-square mb-2 rounded overflow-hidden bg-gray-700">
                      <img
                        src={model.imageUrl}
                        alt={model.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm">{model.name}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {model.category}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && loadingGeneration && (
        <div className="max-w-6xl mx-auto mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 mb-4">
              Generating: {loadingGeneration.prompt}
            </p>
            <div className="animate-pulse flex gap-4">
              <div className="flex-1 h-64 bg-gray-700 rounded-lg"></div>
              <div className="flex-1 h-64 bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        </div>
      )}

      {/* Generations */}
      <div className="max-w-6xl mx-auto space-y-8">
        {generations.map((generation) => (
          <GenerationCard
            key={generation.id}
            generation={generation}
            onImageClick={handleImageClick}
            onDownloadImage={handleDownloadImage}
            onDownloadVideo={handleDownloadVideo}
            togglePlayPause={togglePlayPause}
            setVideoRef={setVideoRef}
            isVideoPlaying={isVideoPlaying}
            handleVideoPlay={handleVideoPlay}
            handleVideoPause={handleVideoPause}
            handleVideoEnded={handleVideoEnded}
          />
        ))}
      </div>

      {/* Video Mode Selection Modal */}
      {videoModeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Select Video Mode</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-medium mb-4">Draft Mode</h3>
                <p className="text-gray-400 mb-2">⚡ Fast (~2 minutes)</p>
                <p className="text-gray-400 mb-4">
                  Lower quality, good for testing
                </p>
                <button
                  onClick={() => handleVideoGeneration('draft')}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Generate Draft
                </button>
              </div>

              <div className="border border-gray-700 rounded-lg p-6">
                <h3 className="text-xl font-medium mb-4">Advanced Mode</h3>
                <p className="text-gray-400 mb-2">🎬 Slower (~7 minutes)</p>
                <p className="text-gray-400 mb-4">
                  High quality, professional output
                </p>
                <button
                  onClick={() => handleVideoGeneration('advanced')}
                  className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Generate Advanced
                </button>
              </div>
            </div>

            <button
              onClick={() => setVideoModeModal(null)}
              className="w-full bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Debug Panel */}
      {debugMode && debugInfo && (
        <div className="fixed top-0 right-0 w-1/3 h-full bg-gray-900 border-l border-gray-700 overflow-auto p-6 z-40">
          <h2 className="text-xl font-bold mb-4">Debug Info</h2>

          {debugInfo.error && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded">
              <h3 className="font-bold mb-2">Error:</h3>
              <pre className="text-sm whitespace-pre-wrap">{debugInfo.error}</pre>
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-bold mb-2">Image URLs:</h3>
            <ul className="text-sm space-y-1">
              {debugInfo.imageUrls?.map((url, i) => (
                <li key={i} className="break-all text-blue-400">{url}</li>
              ))}
            </ul>
          </div>

          {debugInfo.enhancedPrompt && (
            <div className="mb-4">
              <h3 className="font-bold mb-2">Enhanced Prompt:</h3>
              <p className="text-sm">{debugInfo.enhancedPrompt}</p>
            </div>
          )}

          {debugInfo.parsedResponse && (
            <div className="mb-4">
              <h3 className="font-bold mb-2">Parsed Response:</h3>
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(debugInfo.parsedResponse, null, 2)}
              </pre>
            </div>
          )}

          {debugInfo.rawResponse && (
            <div>
              <h3 className="font-bold mb-2">Raw Response:</h3>
              <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
                {debugInfo.rawResponse}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Generation Card Component
function GenerationCard({
  generation,
  onImageClick,
  onDownloadImage,
  onDownloadVideo,
  togglePlayPause,
  setVideoRef,
  isVideoPlaying,
  handleVideoPlay,
  handleVideoPause,
  handleVideoEnded,
}: {
  generation: Generation;
  onImageClick: (id: string, url: string, index: number) => void;
  onDownloadImage: (url: string, index: number) => void;
  onDownloadVideo: (id: string, index: number) => void;
  togglePlayPause: (id: string, index: number) => void;
  setVideoRef: (id: string, index: number, el: HTMLVideoElement | null) => void;
  isVideoPlaying: (id: string, index: number) => boolean;
  handleVideoPlay: (id: string, index: number) => void;
  handleVideoPause: (id: string, index: number) => void;
  handleVideoEnded: (id: string, index: number) => void;
}) {
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Prompt */}
      <div className="mb-4">
        <p className="text-lg">{generation.prompt}</p>
        {generation.enhancedPrompt && (
          <p className="text-sm text-gray-400 mt-1">
            Enhanced prompt available
          </p>
        )}
      </div>

      {/* Images */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {generation.imageUrls.map((url, index) => (
          <div
            key={index}
            className="relative aspect-video rounded-lg overflow-hidden bg-gray-700 group cursor-pointer"
            onMouseEnter={() => setHoveredImage(index)}
            onMouseLeave={() => setHoveredImage(null)}
          >
            <img
              src={url}
              alt={`Generated ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Processing overlay */}
            {generation.processingVideoIndex === index && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <p className="text-white">
                  Generating {generation.processingMode} video...
                </p>
              </div>
            )}

            {/* Hover controls */}
            {hoveredImage === index &&
              generation.processingVideoIndex !== index && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-4">
                  <button
                    onClick={() => onImageClick(generation.id, url, index)}
                    className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Generate Video
                  </button>
                  <button
                    onClick={() => onDownloadImage(url, index)}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    Download
                  </button>
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Videos */}
      {generation.videos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Generated Videos</h3>
          {generation.videos.map((video, index) => (
            <div key={index}>
              <p className="text-sm text-gray-400 mb-2">
                {video.mode === 'draft' ? 'Draft' : 'Advanced'} Video
              </p>

              {video.error ? (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                  <p className="text-red-400">{video.error}</p>
                </div>
              ) : (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-700">
                  <video
                    ref={(el) => setVideoRef(generation.id, index, el)}
                    src={video.url}
                    className="w-full h-full object-cover"
                    onPlay={() => handleVideoPlay(generation.id, index)}
                    onPause={() => handleVideoPause(generation.id, index)}
                    onEnded={() => handleVideoEnded(generation.id, index)}
                    loop
                    playsInline
                  />

                  {/* Play button */}
                  {!isVideoPlaying(generation.id, index) && (
                    <button
                      onClick={() => togglePlayPause(generation.id, index)}
                      className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                        <div className="w-0 h-0 border-l-8 border-l-black border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
                      </div>
                    </button>
                  )}

                  {/* Controls */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                      onClick={() => onDownloadVideo(generation.id, index)}
                      className="bg-gray-900/80 hover:bg-gray-900 px-4 py-2 rounded-lg transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
