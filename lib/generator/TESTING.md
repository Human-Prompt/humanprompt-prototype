# Testing Guide for Generator Module

This guide provides comprehensive testing instructions for the AI Generator module.

## Quick Start

### 1. Run the Example Component

```bash
npm run dev
# Navigate to http://localhost:3000/test-generator
```

### 2. Run Unit Tests

```bash
# Simple JavaScript test
node lib/generator/tests/manual-test.js
```

## Manual Testing Checklist

### ✅ Image Generation Tests

#### Test 1: Basic Image Generation
- [ ] Enter a simple prompt: "a woman at a banana market"
- [ ] Click "Generate"
- [ ] Verify loading animation appears
- [ ] Verify 2 images are displayed after ~30 seconds
- [ ] Verify images are visible and load correctly

#### Test 2: Model Selection
- [ ] Enable "Models" toggle
- [ ] Select "Fiona" model
- [ ] Enter prompt: "a portrait"
- [ ] Click "Generate"
- [ ] Verify images are generated with selected model

#### Test 3: Style Selection
- [ ] Enable "Models" toggle
- [ ] Select "Cinematic Solo Tone" style
- [ ] Enter prompt: "a landscape"
- [ ] Click "Generate"
- [ ] Verify images have the selected style

#### Test 4: Enhanced Prompt
- [ ] Generate images
- [ ] Click on the prompt bubble
- [ ] Verify enhanced prompt modal appears
- [ ] Verify enhanced prompt text is displayed
- [ ] Click "copy" button
- [ ] Verify prompt is copied to clipboard

### ✅ Video Generation Tests

#### Test 5: Draft Video Generation
- [ ] Generate images first
- [ ] Hover over an image
- [ ] Click "Generate Video from Image"
- [ ] Select "Draft Mode"
- [ ] Verify processing indicator appears
- [ ] Wait ~2-3 minutes
- [ ] Verify video appears below images
- [ ] Verify video has "Draft Video" label

#### Test 6: Advanced Video Generation
- [ ] Generate images first
- [ ] Hover over an image
- [ ] Click "Generate Video from Image"
- [ ] Select "Advanced Mode"
- [ ] Verify processing indicator appears
- [ ] Wait ~7-10 minutes
- [ ] Verify polling is happening (check console logs)
- [ ] Verify video appears when complete
- [ ] Verify video has "Advanced Video" label

#### Test 7: Video Playback
- [ ] Click on a generated video
- [ ] Verify video plays
- [ ] Click again to pause
- [ ] Verify video pauses
- [ ] Verify play/pause button appears on hover

#### Test 8: Multiple Videos
- [ ] Generate images
- [ ] Generate draft video from first image
- [ ] Wait for completion
- [ ] Generate advanced video from second image
- [ ] Verify both videos appear in the correct order
- [ ] Verify each video has correct label (Draft/Advanced)

### ✅ Download Tests

#### Test 9: Image Download
- [ ] Generate images
- [ ] Hover over an image
- [ ] Click "Download" button
- [ ] Verify image downloads to your Downloads folder
- [ ] Verify filename is `generated-image-1.jpg` or `generated-image-2.jpg`

#### Test 10: Video Download
- [ ] Generate a video (draft or advanced)
- [ ] Click "Download" button on video
- [ ] Verify video downloads
- [ ] Verify filename format: `generated-video-{generationId}-{videoIndex}.mp4`

### ✅ Error Handling Tests

#### Test 11: Empty Prompt
- [ ] Leave prompt field empty
- [ ] Click "Generate"
- [ ] Verify nothing happens (button should be disabled or no action)

#### Test 12: Network Error (Simulated)
- [ ] Open browser DevTools > Network tab
- [ ] Set throttling to "Offline"
- [ ] Try to generate images
- [ ] Verify error is handled gracefully
- [ ] Verify error appears in debug panel if enabled
- [ ] Set throttling back to "Online"

#### Test 13: Video Generation Timeout
- [ ] Enable Debug mode (Ctrl+Shift+D or click debug button)
- [ ] Check console for timeout warnings during long video generation
- [ ] Verify timeout error is displayed if video takes too long

### ✅ State Management Tests

#### Test 14: Multiple Generations
- [ ] Generate images with prompt "test 1"
- [ ] Generate images with prompt "test 2"
- [ ] Generate images with prompt "test 3"
- [ ] Verify all 3 generations are displayed
- [ ] Verify each has correct prompt
- [ ] Verify images don't mix between generations

#### Test 15: Processing States
- [ ] Generate images
- [ ] Immediately start generating video from first image
- [ ] Try to generate video from second image while first is processing
- [ ] Verify second image shows "processing" state
- [ ] Verify both videos generate successfully

### ✅ Debug Mode Tests

#### Test 16: Debug Information
- [ ] Press Ctrl+Shift+D to enable debug mode
- [ ] Generate images
- [ ] Verify debug panel appears on right side
- [ ] Verify raw response is shown
- [ ] Verify parsed response is shown
- [ ] Verify image URLs are shown
- [ ] Verify enhanced prompt is shown (if available)

#### Test 17: Webhook Responses
- [ ] Enable debug mode
- [ ] Generate a draft video
- [ ] Check debug panel for "Webhook Responses" section
- [ ] Verify draft_video response is logged
- [ ] Generate an advanced video
- [ ] Verify advanced_init, status_check, and final_webhook responses are logged

### ✅ UI/UX Tests

#### Test 18: Responsive Behavior
- [ ] Resize browser window to mobile size
- [ ] Verify UI adapts properly
- [ ] Verify images stack vertically on small screens
- [ ] Verify buttons remain accessible

#### Test 19: Loading States
- [ ] Click generate
- [ ] Verify loading animation appears immediately
- [ ] Verify "Generating..." text or spinner appears
- [ ] Verify generate button is disabled during loading

#### Test 20: Hover Interactions
- [ ] Generate images
- [ ] Hover over first image
- [ ] Verify controls slide up from bottom
- [ ] Move mouse away
- [ ] Verify controls slide back down

## Automated Testing

### Unit Tests

Run the simple unit tests:

```bash
node lib/generator/tests/manual-test.js
```

Expected output:
```
🧪 Running Generator Manual Tests

============================================================
✅ PASS: 1. Extract image URLs from array
✅ PASS: 2. Extract image URLs from object with imageURLs
✅ PASS: 3. Extract image URLs from array with object
✅ PASS: 4. Extract video URL from object
✅ PASS: 5. Extract video URL from string
✅ PASS: 6. Extract video URL from array
✅ PASS: 7. Handle empty object
✅ PASS: 8. Handle null input
============================================================

Results: 8/8 tests passed

✨ All tests passed!
```

### Integration Tests (Future)

To add proper integration tests with Jest or Vitest:

```bash
# Install testing dependencies
npm install -D vitest @testing-library/react @testing-library/react-hooks

# Add to package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

## Browser Console Testing

### Test Data Extraction

Open browser console and run:

```javascript
// Test image URL extraction
const testData = {
  imageURLs: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
  enhancedPrompt: 'test prompt'
};

// Import and test (if module is loaded)
// This will work if you're on the test-generator page
console.log('Testing extraction...');
```

### Monitor API Calls

1. Open DevTools > Network tab
2. Filter by "Fetch/XHR"
3. Generate images
4. Observe webhook calls:
   - Should see POST to image generation webhook
   - Should receive response with imageURLs
5. Generate video
6. Observe video webhook calls:
   - Draft: Single POST to draft webhook
   - Advanced: Multiple POSTs for polling

## Performance Testing

### Test Image Generation Performance

```javascript
// In browser console
console.time('Image Generation');
// Click generate button
// Wait for images to load
console.timeEnd('Image Generation');
// Should be < 60 seconds
```

### Test Video Generation Performance

```javascript
// Draft mode
console.time('Draft Video');
// Generate draft video
// Wait for completion
console.timeEnd('Draft Video');
// Should be ~120 seconds (2 minutes)

// Advanced mode
console.time('Advanced Video');
// Generate advanced video
// Wait for completion
console.timeEnd('Advanced Video');
// Should be ~420 seconds (7 minutes)
```

## Troubleshooting Tests

### Images Not Loading

1. Check Debug panel for errors
2. Verify webhook URLs in `lib/generator/config.ts`
3. Check Network tab for failed requests
4. Verify API is returning expected format

### Videos Not Generating

1. Enable debug mode
2. Check console for polling logs
3. Verify webhook responses in debug panel
4. For advanced mode, ensure polling webhooks are accessible
5. Check for timeout errors

### Tests Failing

1. Clear browser cache
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. Check console for errors
4. Verify all dependencies are installed
5. Restart dev server

## Test Data

### Sample Prompts

Good prompts for testing:

```
- "a woman at a banana market"
- "portrait of a person in cinematic lighting"
- "simple sketch of a flower"
- "futuristic city at sunset"
- "abstract geometric shapes"
```

### Expected Response Formats

Image generation response:
```json
{
  "imageURLs": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "enhancedPrompt": "detailed enhanced prompt text"
}
```

Draft video response:
```json
{
  "url": "https://example.com/video.mp4"
}
```

Advanced video initial response:
```json
{
  "request_id": "abc123",
  "content": "prompt used for generation"
}
```

## CI/CD Testing (Future)

To integrate with CI/CD:

```yaml
# .github/workflows/test.yml
name: Test Generator Module

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
      - run: node lib/generator/tests/manual-test.js
```

## Success Criteria

All tests should:
- ✅ Complete without errors
- ✅ Show appropriate loading states
- ✅ Display results correctly
- ✅ Handle errors gracefully
- ✅ Provide useful debug information
- ✅ Work consistently across multiple runs

## Reporting Issues

If you find bugs:

1. Enable debug mode
2. Reproduce the issue
3. Copy debug panel contents
4. Note browser console errors
5. Document steps to reproduce
6. Include network request/response data
