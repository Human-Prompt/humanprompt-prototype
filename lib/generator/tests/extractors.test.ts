/**
 * Unit tests for data extraction utilities
 * Run with: node --loader ts-node/esm extractors.test.ts
 * Or add to your test suite (Jest, Vitest, etc.)
 */

import {
  extractImageUrls,
  extractVideoUrl,
  extractEnhancedPrompt,
  extractTwoUrlsAndPrompt,
} from '../utils/extractors';

// Test data examples
const testCases = {
  // Image extraction test cases
  imageUrls: [
    {
      name: 'Array of URLs',
      input: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      expected: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    },
    {
      name: 'Object with imageURLs',
      input: {
        imageURLs: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        enhancedPrompt: 'test prompt',
      },
      expected: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    },
    {
      name: 'Array with object containing imageUrls',
      input: [
        {
          imageUrls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        },
      ],
      expected: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    },
  ],

  // Video URL extraction test cases
  videoUrls: [
    {
      name: 'Object with url property',
      input: { url: 'https://example.com/video.mp4' },
      expected: 'https://example.com/video.mp4',
    },
    {
      name: 'Direct URL string',
      input: 'https://example.com/video.mp4',
      expected: 'https://example.com/video.mp4',
    },
    {
      name: 'Array with object containing videoURL',
      input: [{ videoURL: 'https://example.com/video.mp4' }],
      expected: 'https://example.com/video.mp4',
    },
  ],

  // Enhanced prompt extraction test cases
  enhancedPrompts: [
    {
      name: 'Object with enhancedPrompt',
      input: { enhancedPrompt: 'This is an enhanced prompt' },
      expected: 'This is an enhanced prompt',
    },
    {
      name: 'Array with object containing enhanced_prompt',
      input: [{ enhanced_prompt: 'This is an enhanced prompt' }],
      expected: 'This is an enhanced prompt',
    },
    {
      name: 'Direct string',
      input: 'This is an enhanced prompt',
      expected: 'This is an enhanced prompt',
    },
  ],

  // Two URLs and prompt extraction
  twoUrlsAndPrompt: [
    {
      name: 'Complete object',
      input: {
        imageURLs: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
        enhancedPrompt: 'test prompt',
      },
      expected: {
        imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
        enhancedPrompt: 'test prompt',
      },
    },
    {
      name: 'Array with complete object',
      input: [
        {
          imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
          prompt: 'test prompt',
        },
      ],
      expected: {
        imageUrls: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
        enhancedPrompt: 'test prompt',
      },
    },
  ],
};

// Test runner
function runTests() {
  console.log('🧪 Running Generator Utility Tests\n');

  let passed = 0;
  let failed = 0;

  // Test extractImageUrls
  console.log('📸 Testing extractImageUrls()');
  testCases.imageUrls.forEach((test) => {
    const result = extractImageUrls(test.input);
    if (JSON.stringify(result) === JSON.stringify(test.expected)) {
      console.log(`  ✅ ${test.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name}`);
      console.log(`     Expected: ${JSON.stringify(test.expected)}`);
      console.log(`     Got: ${JSON.stringify(result)}`);
      failed++;
    }
  });

  // Test extractVideoUrl
  console.log('\n🎬 Testing extractVideoUrl()');
  testCases.videoUrls.forEach((test) => {
    const result = extractVideoUrl(test.input);
    if (result === test.expected) {
      console.log(`  ✅ ${test.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name}`);
      console.log(`     Expected: ${test.expected}`);
      console.log(`     Got: ${result}`);
      failed++;
    }
  });

  // Test extractEnhancedPrompt
  console.log('\n✨ Testing extractEnhancedPrompt()');
  testCases.enhancedPrompts.forEach((test) => {
    const result = extractEnhancedPrompt(test.input);
    if (result === test.expected) {
      console.log(`  ✅ ${test.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name}`);
      console.log(`     Expected: ${test.expected}`);
      console.log(`     Got: ${result}`);
      failed++;
    }
  });

  // Test extractTwoUrlsAndPrompt
  console.log('\n🔄 Testing extractTwoUrlsAndPrompt()');
  testCases.twoUrlsAndPrompt.forEach((test) => {
    const result = extractTwoUrlsAndPrompt(test.input);
    if (JSON.stringify(result) === JSON.stringify(test.expected)) {
      console.log(`  ✅ ${test.name}`);
      passed++;
    } else {
      console.log(`  ❌ ${test.name}`);
      console.log(`     Expected: ${JSON.stringify(test.expected)}`);
      console.log(`     Got: ${JSON.stringify(result)}`);
      failed++;
    }
  });

  // Summary
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`${'='.repeat(50)}\n`);

  return failed === 0;
}

// Run tests if executed directly
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

export { runTests, testCases };
