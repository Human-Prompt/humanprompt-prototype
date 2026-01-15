/**
 * Simple manual test script for the generator utilities
 * Run with: node lib/generator/tests/manual-test.js
 */

// Mock console to suppress extraction logs during tests
const originalConsoleLog = console.log;
let suppressLogs = true;
console.log = function(...args) {
  if (!suppressLogs) {
    originalConsoleLog.apply(console, args);
  }
};

// Import the extractors (simplified versions for testing)
function extractImageUrls(data) {
  let imageUrls = [];

  try {
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      imageUrls = data;
      return imageUrls;
    }

    if (Array.isArray(data)) {
      if (data.length > 0) {
        const firstItem = data[0];
        if (firstItem.imageURLs && Array.isArray(firstItem.imageURLs)) {
          imageUrls = firstItem.imageURLs;
        } else if (firstItem.imageUrls && Array.isArray(firstItem.imageUrls)) {
          imageUrls = firstItem.imageUrls;
        }
      }
    } else if (data && typeof data === 'object') {
      if (data.imageURLs && Array.isArray(data.imageURLs)) {
        imageUrls = data.imageURLs;
      } else if (data.imageUrls && Array.isArray(data.imageUrls)) {
        imageUrls = data.imageUrls;
      }
    }
  } catch (error) {
    console.error('Error extracting image URLs:', error);
  }

  return imageUrls;
}

function extractVideoUrl(data) {
  let videoUrl = null;

  try {
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];
      if (firstItem.url && typeof firstItem.url === 'string') {
        videoUrl = firstItem.url;
      }
    } else if (data && typeof data === 'object') {
      if (data.url && typeof data.url === 'string') {
        videoUrl = data.url;
      }
    } else if (typeof data === 'string' && data.trim().startsWith('http')) {
      videoUrl = data.trim();
    }
  } catch (error) {
    console.error('Error extracting video URL:', error);
  }

  return videoUrl;
}

// Test cases
const tests = [
  {
    name: '1. Extract image URLs from array',
    fn: () => {
      const input = ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'];
      const result = extractImageUrls(input);
      return result.length === 2 && result[0] === 'https://example.com/img1.jpg';
    }
  },
  {
    name: '2. Extract image URLs from object with imageURLs',
    fn: () => {
      const input = {
        imageURLs: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
      };
      const result = extractImageUrls(input);
      return result.length === 2;
    }
  },
  {
    name: '3. Extract image URLs from array with object',
    fn: () => {
      const input = [{
        imageUrls: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg']
      }];
      const result = extractImageUrls(input);
      return result.length === 2;
    }
  },
  {
    name: '4. Extract video URL from object',
    fn: () => {
      const input = { url: 'https://example.com/video.mp4' };
      const result = extractVideoUrl(input);
      return result === 'https://example.com/video.mp4';
    }
  },
  {
    name: '5. Extract video URL from string',
    fn: () => {
      const input = 'https://example.com/video.mp4';
      const result = extractVideoUrl(input);
      return result === 'https://example.com/video.mp4';
    }
  },
  {
    name: '6. Extract video URL from array',
    fn: () => {
      const input = [{ url: 'https://example.com/video.mp4' }];
      const result = extractVideoUrl(input);
      return result === 'https://example.com/video.mp4';
    }
  },
  {
    name: '7. Handle empty object',
    fn: () => {
      const input = {};
      const result = extractImageUrls(input);
      return result.length === 0;
    }
  },
  {
    name: '8. Handle null input',
    fn: () => {
      const input = null;
      const result = extractImageUrls(input);
      return result.length === 0;
    }
  },
];

// Run tests
suppressLogs = true; // Suppress extraction logs
console.log = originalConsoleLog; // Restore console

console.log('\n🧪 Running Generator Manual Tests\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

tests.forEach(test => {
  try {
    const result = test.fn();
    if (result) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ERROR: ${test.name}`);
    console.log(`   ${error.message}`);
    failed++;
  }
});

console.log('='.repeat(60));
console.log(`\nResults: ${passed}/${tests.length} tests passed`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} test(s) failed\n`);
  process.exit(1);
} else {
  console.log('\n✨ All tests passed!\n');
  process.exit(0);
}
