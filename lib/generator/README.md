# AI Generator Module

A modular, reusable system for generating images and videos from text prompts using AI. This module handles the complete workflow from prompt enhancement to image generation and video creation.

## Features

- **Image Generation**: Generate images from text prompts with optional model/style selection
- **Video Generation**: Convert generated images to videos in two modes:
  - **Draft Mode**: Fast generation (~2 minutes)
  - **Advanced Mode**: High-quality generation (~7 minutes) with polling mechanism
- **Multiple Models/Styles**: Support for different AI models and artistic styles
- **Prompt Enhancement**: Automatic enhancement of user prompts
- **Flexible Data Extraction**: Robust parsing of various API response formats
- **Download Support**: Download generated images and videos
- **Debug Mode**: Comprehensive debugging information for troubleshooting

## Installation

The module is self-contained within the `lib/generator` directory. No additional installation required.

## Quick Start

### Basic Usage

```typescript
import { useGenerator } from '@/lib/generator';

function MyComponent() {
  const {
    generations,
    isLoading,
    generateImages,
    generateVideo,
  } = useGenerator({
    onError: (error) => console.error(error),
    onSuccess: (generation) => console.log('Generated:', generation),
  });

  const handleGenerate = async () => {
    await generateImages(
      'a woman at a banana market',
      false, // modelsEnabled
      'fiona' // selectedModel
    );
  };

  const handleVideoGenerate = async (generationId: string, imageUrl: string) => {
    await generateVideo(
      generationId,
      imageUrl,
      0, // imageIndex
      'draft' // mode: 'draft' | 'advanced'
    );
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate Images</button>
      {generations.map((gen) => (
        <div key={gen.id}>
          {gen.imageUrls.map((url, index) => (
            <img key={index} src={url} alt="Generated" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

### With Video Player

```typescript
import { useGenerator, useVideoPlayer } from '@/lib/generator';

function MyComponent() {
  const { generations, generateImages, generateVideo } = useGenerator();
  const { togglePlayPause, setVideoRef, isVideoPlaying } = useVideoPlayer();

  return (
    <div>
      {generations.map((gen) => (
        <div key={gen.id}>
          {gen.videos.map((video, index) => (
            <video
              key={index}
              ref={(el) => setVideoRef(gen.id, index, el)}
              src={video.url}
              onClick={() => togglePlayPause(gen.id, index)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Module Structure

```
lib/generator/
├── index.ts                    # Main entry point
├── types.ts                    # TypeScript type definitions
├── config.ts                   # Configuration (URLs, models, timeouts)
├── hooks/
│   ├── useGenerator.ts         # Main state management hook
│   └── useVideoPlayer.ts       # Video player state management
├── services/
│   ├── imageService.ts         # Image generation API
│   └── videoService.ts         # Video generation API
└── utils/
    ├── extractors.ts           # Data extraction utilities
    └── download.ts             # Download utilities
```

## Core Concepts

### Types

Key interfaces used throughout the module:

- `Generation`: Represents a complete generation with images and videos
- `VideoObject`: Individual video with metadata
- `Model`: Model/style definition
- `DebugInfo`: Debug information for troubleshooting

### Configuration

All URLs and constants are centralized in `config.ts`:

```typescript
import { WEBHOOK_URLS, MODELS, TIMEOUTS } from '@/lib/generator';

// Access webhook URLs
const imageUrl = WEBHOOK_URLS.IMAGE_GENERATION.FIONA;

// Access available models
const models = MODELS;

// Access timeout configurations
const draftTimeout = TIMEOUTS.DRAFT_VIDEO;
```

### Services

#### Image Service

```typescript
import { generateImages } from '@/lib/generator';

const result = await generateImages(
  { prompt: 'a woman at a banana market' },
  true, // modelsEnabled
  'fiona' // selectedModel
);

console.log(result.imageUrls); // Array of 2 image URLs
console.log(result.enhancedPrompt); // Enhanced prompt
```

#### Video Service

```typescript
import { generateVideo } from '@/lib/generator';

const result = await generateVideo(
  'https://example.com/image.jpg',
  'advanced', // or 'draft'
  'Enhanced prompt here',
  {
    onProgress: (msg) => console.log(msg),
    onPollingStart: (id) => console.log('Polling:', id),
    onPollingUpdate: (status) => console.log('Status:', status),
  }
);

console.log(result.videoUrl);
console.log(result.error);
```

### Utilities

#### Data Extraction

The module includes robust utilities for extracting data from various API response formats:

```typescript
import {
  extractImageUrls,
  extractVideoUrl,
  extractEnhancedPrompt,
  extractTwoUrlsAndPrompt,
} from '@/lib/generator';

// Extract image URLs from response
const imageUrls = extractImageUrls(responseData);

// Extract exactly 2 URLs and prompt
const { imageUrls, enhancedPrompt } = extractTwoUrlsAndPrompt(responseData);

// Extract video URL
const videoUrl = extractVideoUrl(responseData);
```

#### Downloads

```typescript
import { downloadImage, downloadVideo } from '@/lib/generator';

// Download image
await downloadImage('https://example.com/image.jpg', 0);

// Download video
await downloadVideo('https://example.com/video.mp4', 'gen_123', 0);
```

## Hooks

### useGenerator

Main hook for managing all generator state and operations.

```typescript
const {
  // State
  generations,         // Array of all generations
  isLoading,          // Loading state
  isTransitioning,    // Transition animation state
  loadingGeneration,  // Currently loading generation
  debugInfo,          // Debug information

  // Actions
  generateImages,     // Generate images from prompt
  generateVideo,      // Generate video from image
  clearGenerations,   // Clear all generations
  removeGeneration,   // Remove specific generation
  setDebugInfo,       // Set debug information
} = useGenerator({
  onError: (error) => {},
  onSuccess: (generation) => {},
});
```

### useVideoPlayer

Hook for managing video player state.

```typescript
const {
  isPlaying,          // Playing state for all videos
  videoRefs,          // Video element references
  togglePlayPause,    // Toggle play/pause
  setVideoRef,        // Set video reference
  handleVideoPlay,    // Handle play event
  handleVideoPause,   // Handle pause event
  handleVideoEnded,   // Handle ended event
  isVideoPlaying,     // Check if specific video is playing
  getVideoElement,    // Get video element
} = useVideoPlayer();
```

### useFullscreenVideoPlayer

Separate hook for fullscreen video player.

```typescript
const {
  isPlaying,
  videoRef,
  togglePlayPause,
  setVideoElement,
  handlePlay,
  handlePause,
  handleEnded,
} = useFullscreenVideoPlayer();
```

## Advanced Usage

### Custom Model Configuration

You can extend the available models by modifying `config.ts`:

```typescript
export const MODELS: Model[] = [
  {
    id: 'custom-model',
    name: 'My Custom Model',
    imageUrl: '/images/custom-model.jpg',
    category: 'models',
  },
  // ... other models
];
```

### Custom Webhook URLs

Override webhook URLs by modifying `config.ts`:

```typescript
export const WEBHOOK_URLS = {
  IMAGE_GENERATION: {
    CUSTOM_MODEL: 'https://your-webhook-url.com/custom',
  },
  // ... other webhooks
};
```

### Error Handling

The module provides comprehensive error handling:

```typescript
const { generateImages } = useGenerator({
  onError: (error) => {
    // Handle errors
    console.error('Generation failed:', error);
    // Show user-friendly message
    alert('Failed to generate images. Please try again.');
  },
});
```

### Debug Mode

Access detailed debug information:

```typescript
const { debugInfo, setDebugInfo } = useGenerator();

console.log(debugInfo?.rawResponse);      // Raw API response
console.log(debugInfo?.parsedResponse);   // Parsed response
console.log(debugInfo?.imageUrls);        // Extracted URLs
console.log(debugInfo?.error);            // Error messages
console.log(debugInfo?.webhookResponses); // Webhook responses
```

## Video Generation Modes

### Draft Mode

- Fast generation (~2 minutes)
- Lower quality with possible artifacts
- Good for rapid prototyping
- Direct webhook response

### Advanced Mode

- Slower generation (~7 minutes)
- Higher quality, professional outputs
- Polling mechanism for status checking
- Three-step process:
  1. Initial request returns `request_id`
  2. Poll status every 30 seconds
  3. Fetch final video URL when complete

## API Response Formats

The module handles multiple response formats automatically:

### Image Generation Response

```json
{
  "imageURLs": ["url1", "url2"],
  "enhancedPrompt": "enhanced prompt text"
}
```

Or:

```json
[
  {
    "imageUrls": ["url1", "url2"],
    "enhanced_prompt": "enhanced prompt text"
  }
]
```

### Video Generation Response (Draft)

```json
{
  "url": "video-url"
}
```

Or just:

```
https://video-url.com/video.mp4
```

### Video Generation Response (Advanced)

Initial response:

```json
{
  "request_id": "abc123",
  "content": "prompt used for video"
}
```

Status check response:

```json
{
  "status": "COMPLETED"
}
```

Final response:

```json
{
  "url": "video-url"
}
```

## Customization

### Timeouts

Modify timeouts in `config.ts`:

```typescript
export const TIMEOUTS = {
  DRAFT_VIDEO: 5 * 60 * 1000, // 5 minutes
  ADVANCED_VIDEO_MAX_POLLING: 15 * 60 * 1000, // 15 minutes
  ADVANCED_VIDEO_POLL_INTERVAL: 60 * 1000, // 60 seconds
  GENERATION_ANIMATION: 1000, // 1 second
};
```

### Progress Callbacks

Get real-time updates during video generation:

```typescript
await generateVideo(imageUrl, 'advanced', prompt, {
  onProgress: (message) => {
    console.log('Progress:', message);
    // Update UI with progress message
  },
  onPollingStart: (requestId) => {
    console.log('Started polling:', requestId);
  },
  onPollingUpdate: (status) => {
    console.log('Polling status:', status);
  },
});
```

## Best Practices

1. **Error Handling**: Always provide `onError` callback to handle failures gracefully
2. **Loading States**: Use `isLoading` and `isTransitioning` to show appropriate UI feedback
3. **Video Refs**: Properly manage video refs using `setVideoRef` from `useVideoPlayer`
4. **Memory Management**: Clear generations when no longer needed using `clearGenerations`
5. **Debug Mode**: Enable debug mode during development to troubleshoot API issues

## Troubleshooting

### No Images Generated

- Check `debugInfo.rawResponse` for API response
- Verify webhook URLs in `config.ts`
- Ensure API returns data in expected format

### Video Generation Fails

- Check mode-specific timeouts
- For advanced mode, verify polling webhooks are accessible
- Check `debugInfo.webhookResponses` for detailed logs

### Video Won't Play

- Verify video URL is valid
- Check browser console for CORS errors
- Ensure video format is supported by browser

## License

This module is part of the HumanPrompt frontend application.
