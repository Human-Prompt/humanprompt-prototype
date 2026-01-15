/**
 * Utility functions for extracting data from API responses
 */

/**
 * Extract image URLs from API response
 * Handles multiple response formats and property names
 */
export function extractImageUrls(data: any): string[] {
  let imageUrls: string[] = [];

  try {
    // If data is already an array of strings (URLs), use it directly
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'string') {
      imageUrls = data;
      console.log('Data is already an array of URLs:', imageUrls);
      return imageUrls;
    }

    // Check if it's an array response with objects
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const firstItem = data[0];

        // PRIORITY: Try to extract imageURLs (case sensitive with uppercase URL)
        if (firstItem.imageURLs && Array.isArray(firstItem.imageURLs)) {
          imageUrls = firstItem.imageURLs;
          console.log('Extracted imageURLs from array response:', imageUrls);
        }
        // Try to extract imageUrls (lowercase)
        else if (firstItem.imageUrls && Array.isArray(firstItem.imageUrls)) {
          imageUrls = firstItem.imageUrls;
          console.log('Extracted imageUrls from array response:', imageUrls);
        }
        // Try to extract urls
        else if (firstItem.urls && Array.isArray(firstItem.urls)) {
          imageUrls = firstItem.urls;
          console.log('Extracted urls from array response:', imageUrls);
        }
        // Try to extract images
        else if (firstItem.images && Array.isArray(firstItem.images)) {
          imageUrls = firstItem.images;
          console.log('Extracted images from array response:', imageUrls);
        }
        // Check if the item itself is a string array
        else if (Array.isArray(firstItem) && firstItem.every((item) => typeof item === 'string')) {
          imageUrls = firstItem;
          console.log('First item is a string array:', imageUrls);
        }
      }
    }
    // Check if it's a direct object response
    else if (data && typeof data === 'object') {
      // PRIORITY: Try to extract imageURLs (case sensitive with uppercase URL)
      if (data.imageURLs && Array.isArray(data.imageURLs)) {
        imageUrls = data.imageURLs;
        console.log('Extracted imageURLs from direct object:', imageUrls);
      }
      // Try to extract imageUrls (lowercase)
      else if (data.imageUrls && Array.isArray(data.imageUrls)) {
        imageUrls = data.imageUrls;
        console.log('Extracted imageUrls from direct object:', imageUrls);
      }
      // Try to extract urls
      else if (data.urls && Array.isArray(data.urls)) {
        imageUrls = data.urls;
        console.log('Extracted urls from direct object:', imageUrls);
      }
      // Try to extract images
      else if (data.images && Array.isArray(data.images)) {
        imageUrls = data.images;
        console.log('Extracted images from direct object:', imageUrls);
      }
    }
  } catch (error) {
    console.error('Error extracting image URLs:', error);
  }

  return imageUrls;
}

/**
 * Extract enhanced prompt from API response
 * Handles multiple response formats and property names
 */
export function extractEnhancedPrompt(data: any): string | null {
  let enhancedPrompt: string | null = null;

  try {
    // Check if it's an array response
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];

      // Try different property names
      if (firstItem.enhancedPrompt && typeof firstItem.enhancedPrompt === 'string') {
        enhancedPrompt = firstItem.enhancedPrompt;
      } else if (firstItem.enhanced_prompt && typeof firstItem.enhanced_prompt === 'string') {
        enhancedPrompt = firstItem.enhanced_prompt;
      } else if (firstItem.prompt && typeof firstItem.prompt === 'string') {
        enhancedPrompt = firstItem.prompt;
      } else if (firstItem.output && typeof firstItem.output === 'string') {
        enhancedPrompt = firstItem.output;
      }
    }
    // Check if it's a direct object response
    else if (data && typeof data === 'object') {
      // Try different property names
      if (data.enhancedPrompt && typeof data.enhancedPrompt === 'string') {
        enhancedPrompt = data.enhancedPrompt;
      } else if (data.enhanced_prompt && typeof data.enhanced_prompt === 'string') {
        enhancedPrompt = data.enhanced_prompt;
      } else if (data.prompt && typeof data === 'string') {
        enhancedPrompt = data;
      } else if (data.output && typeof data === 'string') {
        enhancedPrompt = data;
      }
    }
    // Check if the data itself is a string
    else if (typeof data === 'string') {
      enhancedPrompt = data;
    }
  } catch (error) {
    console.error('Error extracting enhanced prompt:', error);
  }

  return enhancedPrompt;
}

/**
 * Extract exactly two image URLs and enhanced prompt from response
 * This is specifically for image generation which expects 2 images
 */
export function extractTwoUrlsAndPrompt(
  data: any
): { imageUrls: string[]; enhancedPrompt: string | null } {
  let imageUrls: string[] = [];
  let enhancedPrompt: string | null = null;

  console.log('Extracting from response data:', data);

  try {
    // Case 1: If data is an array with objects containing URLs
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];

      // Try to extract enhanced prompt first
      if (firstItem.enhancedPrompt) {
        enhancedPrompt = firstItem.enhancedPrompt;
      } else if (firstItem.enhanced_prompt) {
        enhancedPrompt = firstItem.enhanced_prompt;
      } else if (firstItem.prompt) {
        enhancedPrompt = firstItem.prompt;
      } else if (firstItem.output) {
        enhancedPrompt = firstItem.output;
      }

      // PRIORITY: Check for imageURLs first (with uppercase URL)
      if (firstItem.imageURLs && Array.isArray(firstItem.imageURLs)) {
        imageUrls = firstItem.imageURLs.slice(0, 2); // Take first two
        console.log('Found imageURLs in array first item:', imageUrls);
      }
      // Then check other possible property names
      else if (firstItem.imageUrls && Array.isArray(firstItem.imageUrls)) {
        imageUrls = firstItem.imageUrls.slice(0, 2);
        console.log('Found imageUrls in array first item:', imageUrls);
      } else if (firstItem.urls && Array.isArray(firstItem.urls)) {
        imageUrls = firstItem.urls.slice(0, 2);
        console.log('Found urls in array first item:', imageUrls);
      } else if (firstItem.images && Array.isArray(firstItem.images)) {
        imageUrls = firstItem.images.slice(0, 2);
        console.log('Found images in array first item:', imageUrls);
      }

      // If we found URLs in the first item, return them
      if (imageUrls.length > 0) {
        return { imageUrls, enhancedPrompt };
      }

      // If the array itself contains URLs as strings
      if (data.length >= 2 && typeof data[0] === 'string' && typeof data[1] === 'string') {
        imageUrls = [data[0], data[1]];
        console.log('Found URLs directly in array:', imageUrls);
        return { imageUrls, enhancedPrompt };
      }
    }

    // Case 2: If data is an object with URL properties
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      // Try to extract enhanced prompt
      if (data.enhancedPrompt) {
        enhancedPrompt = data.enhancedPrompt;
      } else if (data.enhanced_prompt) {
        enhancedPrompt = data.enhanced_prompt;
      } else if (data.prompt) {
        enhancedPrompt = data.prompt;
      } else if (data.output) {
        enhancedPrompt = data.output;
      }

      // PRIORITY: Check for imageURLs first (with uppercase URL)
      if (data.imageURLs && Array.isArray(data.imageURLs)) {
        imageUrls = data.imageURLs.slice(0, 2);
        console.log('Found imageURLs in object:', imageUrls);
      }
      // Then check other possible property names
      else if (data.imageUrls && Array.isArray(data.imageUrls)) {
        imageUrls = data.imageUrls.slice(0, 2);
        console.log('Found imageUrls in object:', imageUrls);
      } else if (data.urls && Array.isArray(data.urls)) {
        imageUrls = data.urls.slice(0, 2);
        console.log('Found urls in object:', imageUrls);
      } else if (data.images && Array.isArray(data.images)) {
        imageUrls = data.images.slice(0, 2);
        console.log('Found images in object:', imageUrls);
      }

      // Check for specific URL properties like url1/url2 or image1/image2
      if (imageUrls.length === 0) {
        const urlPairs = [
          ['imageURL1', 'imageURL2'], // Add this pair first for priority
          ['url1', 'url2'],
          ['image1', 'image2'],
          ['imageUrl1', 'imageUrl2'],
          ['image_url_1', 'image_url_2'],
          ['image_1', 'image_2'],
        ];

        for (const [key1, key2] of urlPairs) {
          if (
            data[key1] &&
            data[key2] &&
            typeof data[key1] === 'string' &&
            typeof data[key2] === 'string'
          ) {
            imageUrls = [data[key1], data[key2]];
            console.log(`Found URLs in properties ${key1} and ${key2}:`, imageUrls);
            break;
          }
        }
      }

      // Check for a results or output array containing the URLs
      if (imageUrls.length === 0) {
        const arrayProps = ['imageURLs', 'results', 'output', 'images', 'urls', 'imageUrls'];

        for (const prop of arrayProps) {
          if (data[prop] && Array.isArray(data[prop]) && data[prop].length >= 2) {
            if (typeof data[prop][0] === 'string' && typeof data[prop][1] === 'string') {
              imageUrls = [data[prop][0], data[prop][1]];
              console.log(`Found URLs in array property ${prop}:`, imageUrls);
              break;
            }
          }
        }
      }
    }

    // Case 3: If we still don't have 2 URLs, try to find any URLs in the data
    if (imageUrls.length < 2) {
      console.log('Searching for URLs in entire data structure');
      const allUrls: string[] = [];

      // Function to recursively search for URL strings in the data
      const findUrls = (obj: any) => {
        if (!obj) return;

        if (typeof obj === 'string' && obj.match(/^https?:\/\//)) {
          allUrls.push(obj);
        } else if (Array.isArray(obj)) {
          obj.forEach((item) => findUrls(item));
        } else if (typeof obj === 'object') {
          // Check for imageURLs property first
          if (obj.imageURLs && Array.isArray(obj.imageURLs)) {
            obj.imageURLs.forEach((url: any) => {
              if (typeof url === 'string' && url.match(/^https?:\/\//)) {
                allUrls.push(url);
              }
            });
          }

          // Then check all other properties
          Object.entries(obj).forEach(([key, value]) => {
            if (key !== 'imageURLs') {
              // Skip imageURLs as we already processed it
              findUrls(value);
            }
          });
        }
      };

      findUrls(data);

      if (allUrls.length >= 2) {
        imageUrls = allUrls.slice(0, 2);
        console.log('Found URLs by deep search:', imageUrls);
      }
    }

    // If we still don't have an enhanced prompt, try to find any string that looks like a prompt
    if (!enhancedPrompt) {
      const promptProps = ['description', 'text', 'content', 'caption', 'message'];

      if (typeof data === 'object' && data !== null) {
        for (const prop of promptProps) {
          if (data[prop] && typeof data[prop] === 'string' && data[prop].length > 20) {
            enhancedPrompt = data[prop];
            console.log(`Found potential prompt in property ${prop}:`, enhancedPrompt);
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting URLs and prompt:', error);
  }

  console.log('Final extraction results:', { imageUrls, enhancedPrompt });
  return { imageUrls, enhancedPrompt };
}

/**
 * Extract video URL from API response
 * Handles multiple response formats
 */
export function extractVideoUrl(data: any): string | null {
  let videoUrl: string | null = null;

  try {
    // Check if it's an array response
    if (Array.isArray(data) && data.length > 0) {
      const firstItem = data[0];

      // Try different property names
      if (firstItem.url && typeof firstItem.url === 'string') {
        videoUrl = firstItem.url;
      } else if (firstItem.videoURL && typeof firstItem.videoURL === 'string') {
        videoUrl = firstItem.videoURL;
      } else if (firstItem.videoUrl && typeof firstItem.videoUrl === 'string') {
        videoUrl = firstItem.videoUrl;
      } else if (firstItem.video && typeof firstItem.video === 'string') {
        videoUrl = firstItem.video;
      }
    }
    // Check if it's a direct object response
    else if (data && typeof data === 'object') {
      // Try different property names
      if (data.url && typeof data.url === 'string') {
        videoUrl = data.url;
      } else if (data.videoURL && typeof data.videoURL === 'string') {
        videoUrl = data.videoURL;
      } else if (data.videoUrl && typeof data.videoUrl === 'string') {
        videoUrl = data.videoUrl;
      } else if (data.video && typeof data === 'string') {
        videoUrl = data.video;
      }
    }
    // Check if the data itself is a string that looks like a URL
    else if (typeof data === 'string' && data.trim().startsWith('http')) {
      videoUrl = data.trim();
    }
  } catch (error) {
    console.error('Error extracting video URL:', error);
  }

  return videoUrl;
}

/**
 * Extract URLs from text using regex
 * Fallback for when JSON parsing fails
 */
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s"]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches.slice(0, 2) : [];
}
