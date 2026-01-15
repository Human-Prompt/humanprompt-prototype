# Migration Guide: From Monolithic to Modular

This guide helps you migrate from the original 2700+ line `app/page.tsx` to the new modular generator system.

## What Changed

### Before (Monolithic)
- Single 2700+ line file with everything mixed together
- Hardcoded URLs throughout the code
- Difficult to test individual pieces
- Hard to reuse in other applications
- Complex state management mixed with UI

### After (Modular)
- Clean separation of concerns
- Centralized configuration
- Reusable hooks and services
- Easy to test
- Portable to other applications
- Clear, documented API

## File Structure

### Old Structure
```
app/
└── page.tsx (2700+ lines)
```

### New Structure
```
lib/generator/
├── index.ts                 # Main exports
├── types.ts                 # Type definitions
├── config.ts                # Configuration
├── README.md                # Documentation
├── EXAMPLE.tsx              # Usage example
├── MIGRATION_GUIDE.md       # This file
├── hooks/
│   ├── useGenerator.ts      # Main state hook
│   └── useVideoPlayer.ts    # Video player hook
├── services/
│   ├── imageService.ts      # Image API
│   └── videoService.ts      # Video API
└── utils/
    ├── extractors.ts        # Data extraction
    └── download.ts          # Downloads
```

## Migration Steps

### Step 1: Install the Module

The module is already in your project at `lib/generator/`. No installation needed!

### Step 2: Update Your Component

Replace your old monolithic component with the new modular approach:

#### Old Code (app/page.tsx)
```tsx
'use client';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // ... 100+ more state variables

  const handleGenerate = async () => {
    // ... 200+ lines of code
  };

  const handleGenerateVideo = async () => {
    // ... 800+ lines of code with polling logic
  };

  // ... 2000+ more lines
}
```

#### New Code
```tsx
'use client';

import { useGenerator, useVideoPlayer } from '@/lib/generator';

export default function Home() {
  const [prompt, setPrompt] = useState('');

  const {
    generations,
    isLoading,
    generateImages,
    generateVideo,
  } = useGenerator({
    onError: (error) => console.error(error),
    onSuccess: (gen) => console.log('Generated:', gen),
  });

  const { togglePlayPause, setVideoRef } = useVideoPlayer();

  const handleGenerate = async () => {
    await generateImages(prompt, modelsEnabled, selectedModel);
    setPrompt('');
  };

  const handleVideoGenerate = async (genId, imageUrl, index, mode) => {
    await generateVideo(genId, imageUrl, index, mode);
  };

  // Render your UI...
}
```

### Step 3: Update Configuration

Instead of hardcoded URLs in your code, update `lib/generator/config.ts`:

#### Old Approach
```tsx
// Scattered throughout 2700 lines:
const webhookUrl = 'https://humanprompt.app.n8n.cloud/webhook/...';
const draftWebhook = 'https://humanprompt.app.n8n.cloud/webhook/...';
const advancedWebhook = 'https://humanprompt.app.n8n.cloud/webhook/...';
// etc...
```

#### New Approach
```tsx
// All in one place (lib/generator/config.ts):
export const WEBHOOK_URLS = {
  IMAGE_GENERATION: {
    FIONA: 'https://...',
    CAMILLA: 'https://...',
  },
  VIDEO_GENERATION: {
    DRAFT: 'https://...',
    ADVANCED: 'https://...',
  },
};
```

### Step 4: Replace Helper Functions

#### Old Approach
```tsx
// Inside your 2700-line component:
const extractImageUrls = (data: any): string[] => {
  // 75 lines of extraction logic
};

const extractVideoUrl = (data: any): string | null => {
  // 40 lines of extraction logic
};

// etc...
```

#### New Approach
```tsx
import {
  extractImageUrls,
  extractVideoUrl,
  extractEnhancedPrompt,
} from '@/lib/generator';

// Use them directly
const imageUrls = extractImageUrls(responseData);
const videoUrl = extractVideoUrl(responseData);
```

### Step 5: Replace Download Logic

#### Old Approach
```tsx
const handleDownloadImage = (url: string, index: number) => {
  const downloadImage = async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl);
      // ... 20 lines of download logic
    } catch (error) {
      // ...
    }
  };
  downloadImage(url);
};
```

#### New Approach
```tsx
import { downloadImage, downloadVideo } from '@/lib/generator';

const handleDownloadImage = async (url: string, index: number) => {
  try {
    await downloadImage(url, index);
  } catch (error) {
    alert(error.message);
  }
};
```

### Step 6: Simplify Video Player Logic

#### Old Approach
```tsx
const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
const videoRefs = useRef<{ [key: string]: { [videoIndex: number]: HTMLVideoElement | null } }>({});

const togglePlayPause = (generationId: string, videoIndex: number) => {
  const videoKey = `${generationId}-${videoIndex}`;
  if (!videoRefs.current[generationId]) {
    videoRefs.current[generationId] = {};
  }
  const videoRef = videoRefs.current[generationId][videoIndex];
  if (!videoRef) return;
  // ... 30 more lines
};
```

#### New Approach
```tsx
import { useVideoPlayer } from '@/lib/generator';

const { togglePlayPause, setVideoRef, isVideoPlaying } = useVideoPlayer();

// Use directly in your video elements
<video
  ref={(el) => setVideoRef(generation.id, index, el)}
  onClick={() => togglePlayPause(generation.id, index)}
/>
```

## Feature Mapping

### Image Generation

| Old Code Location | New Location |
|------------------|--------------|
| `handleGenerate` function (lines 504-706) | `useGenerator().generateImages()` |
| Webhook URL selection (lines 525-542) | `config.ts` + `getImageGenerationWebhookUrl()` |
| Response extraction (lines 594-650) | `services/imageService.ts` |
| Debug logging (lines 544-560) | Built into `useGenerator()` |

### Video Generation

| Old Code Location | New Location |
|------------------|--------------|
| Draft mode (lines 1385-1555) | `services/videoService.ts` → `generateDraftVideo()` |
| Advanced mode (lines 870-1383) | `services/videoService.ts` → `generateAdvancedVideo()` |
| Polling logic (lines 982-1295) | `services/videoService.ts` → `startPollingProcess()` |
| Timeout handling (lines 1386-1397) | `config.ts` → `TIMEOUTS` |

### Data Extraction

| Old Code Location | New Location |
|------------------|--------------|
| `extractImageUrls` (lines 194-269) | `utils/extractors.ts` |
| `extractEnhancedPrompt` (lines 271-313) | `utils/extractors.ts` |
| `extractTwoUrlsAndPrompt` (lines 315-502) | `utils/extractors.ts` |
| `extractVideoUrl` (lines 775-817) | `utils/extractors.ts` |

### Downloads

| Old Code Location | New Location |
|------------------|--------------|
| `handleDownloadImage` (lines 708-738) | `utils/download.ts` → `downloadImage()` |
| `handleDownloadVideo` (lines 740-773) | `utils/download.ts` → `downloadVideo()` |

## Breaking Changes

### None!

The new module is designed to be a drop-in replacement. Your UI components can remain largely the same.

### Optional Improvements

While not required, consider these improvements:

1. **Use TypeScript types**: Import types from `lib/generator/types.ts`
2. **Centralize models**: Use `MODELS` from config instead of hardcoding
3. **Error handling**: Use the `onError` callback for better UX
4. **Debug mode**: Use built-in `debugInfo` instead of custom logging

## Testing Your Migration

### 1. Test Image Generation
```tsx
const { generateImages } = useGenerator();
await generateImages('test prompt', false, 'fiona');
// Verify images are generated and displayed
```

### 2. Test Draft Video
```tsx
const { generateVideo } = useGenerator();
await generateVideo(genId, imageUrl, 0, 'draft');
// Verify video generates in ~2 minutes
```

### 3. Test Advanced Video
```tsx
await generateVideo(genId, imageUrl, 0, 'advanced');
// Verify polling works and video generates in ~7 minutes
```

### 4. Test Downloads
```tsx
import { downloadImage, downloadVideo } from '@/lib/generator';
await downloadImage(imageUrl, 0);
await downloadVideo(videoUrl, genId, 0);
// Verify files download correctly
```

## Common Issues

### Issue: "Cannot find module '@/lib/generator'"

**Solution**: Make sure the path alias is set up in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: Videos won't play

**Solution**: Make sure you're using `setVideoRef` from `useVideoPlayer()`:
```tsx
const { setVideoRef } = useVideoPlayer();

<video
  ref={(el) => setVideoRef(generation.id, index, el)}
  src={video.url}
/>
```

### Issue: Debug info not showing

**Solution**: The debug info is in the `useGenerator` hook:
```tsx
const { debugInfo } = useGenerator();

console.log(debugInfo?.rawResponse);
console.log(debugInfo?.error);
```

### Issue: Custom model not working

**Solution**: Add your model to `lib/generator/config.ts`:
```tsx
export const MODELS: Model[] = [
  // ... existing models
  {
    id: 'my-model',
    name: 'My Model',
    imageUrl: '/images/my-model.jpg',
    category: 'models',
  },
];
```

Then add the webhook URL:
```tsx
export const WEBHOOK_URLS = {
  IMAGE_GENERATION: {
    // ... existing webhooks
    MY_MODEL: 'https://...',
  },
};
```

And update the mapping function:
```tsx
export function getImageGenerationWebhookUrl(
  modelsEnabled: boolean,
  selectedModel: string
): string {
  const modelMap: Record<string, string> = {
    // ... existing mappings
    'my-model': WEBHOOK_URLS.IMAGE_GENERATION.MY_MODEL,
  };
  // ...
}
```

## Rollback Plan

If you need to rollback to the old code:

1. The original `app/page.tsx` is still in your repository
2. Simply replace the new component with the old one
3. No database changes or API changes were made

## Benefits After Migration

✅ **Cleaner code**: 2700 lines → ~200 lines in your component
✅ **Reusable**: Use in any React application
✅ **Testable**: Test individual functions and hooks
✅ **Maintainable**: Easy to find and fix bugs
✅ **Configurable**: Change URLs and settings in one place
✅ **Documented**: Comprehensive README and examples
✅ **Type-safe**: Full TypeScript support

## Next Steps

1. Review the [README.md](./README.md) for complete API documentation
2. Check out [EXAMPLE.tsx](./EXAMPLE.tsx) for a working example
3. Start migrating your components one at a time
4. Test thoroughly before deploying

## Support

If you encounter issues during migration:

1. Check the [README.md](./README.md) for documentation
2. Review [EXAMPLE.tsx](./EXAMPLE.tsx) for usage patterns
3. Enable debug mode to see detailed logs
4. Check the browser console for error messages

## Summary

The new modular structure makes your code:
- **Shorter**: 2700 lines → ~200 lines in your component
- **Clearer**: Separation of concerns
- **Safer**: Type-safe with TypeScript
- **Faster**: Better performance with optimized hooks
- **Portable**: Easy to use in other applications

Happy coding! 🚀
