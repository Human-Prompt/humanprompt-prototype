'use client';

import type React from 'react';

import { Switch } from '@/components/ui/switch';
import { AlertCircle, Bug, Download, Film, Play, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface Model {
  id: string;
  name: string;
  imageUrl: string;
  category: 'models' | 'styles';
}

// Define a new interface for video objects
interface VideoObject {
  url: string;
  mode: 'draft' | 'advanced';
  enhancedPrompt: string | null;
  advancedPrompt: string | null; // Add this new field for advanced video prompt
  error: string | null;
  timestamp: number;
}

interface Generation {
  id: string;
  prompt: string;
  enhancedPrompt: string | null;
  imageUrls: string[];
  videos: VideoObject[]; // Changed from videoUrl to videos array
  processingVideoIndex: number | null;
  processingMode: 'draft' | 'advanced' | null; // Added to track which mode is processing
  selectedImageIndex: number | null;
}

interface DebugInfo {
  rawResponse: string;
  parsedResponse: any;
  imageUrls: string[];
  enhancedPrompt: string | null;
  error: string | null;
  webhookResponses?: any[]; // Added to track webhook responses for debugging
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [modelsEnabled, setModelsEnabled] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [hoveredImage, setHoveredImage] = useState<{
    generationId: string;
    imageIndex: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingGeneration, setLoadingGeneration] = useState<{ id: string; prompt: string } | null>(
    null,
  );
  const [fullscreenMedia, setFullscreenMedia] = useState<{
    type: 'image' | 'video';
    url: string;
    generationId?: string;
    videoId?: number; // Added to identify specific video
  } | null>(null);
  const [showEnhancedPrompt, setShowEnhancedPrompt] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [modelsEnabledAfterGenerations, setModelsEnabledAfterGenerations] = useState(false);

  const [videoGenerationModal, setVideoGenerationModal] = useState<{
    show: boolean;
    generationId: string;
    imageUrl: string;
    imageIndex: number;
  } | null>(null);

  // Models data
  const models: {
    id: string;
    name: string;
    imageUrl: string;
    category: 'models' | 'styles';
  }[] = [
    {
      id: 'fiona',
      name: 'Fiona',
      imageUrl: '/images/fiona-model.jpeg',
      category: 'models',
    },
    {
      id: 'camilla',
      name: 'Camilla',
      imageUrl:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Fictional_Model_Camilla_-_FLUX_e000010_01_20250216201026-PzIYuIP2XHSub7G5Fgd9eTs2BTAeis.jpeg',
      category: 'models',
    },
    {
      id: 'cinematic',
      name: 'Cinematic Solo Tone',
      imageUrl:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Z.jpg-dpvX4dqgGQks8OOB8NZVQZUTMAcTnh.jpeg',
      category: 'styles',
    },
    {
      id: 'sketch',
      name: 'Simple Sketch',
      imageUrl:
        'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Simple%20Sketch.jpg-LTc3YSLW1FhYn5scu3oTtU4o6NCugm.jpeg',
      category: 'styles',
    },
  ];

  const [selectedModel, setSelectedModel] = useState<string>('fiona');

  // Use a more complex structure for video refs to handle multiple videos
  const videoRefs = useRef<{ [key: string]: { [videoIndex: number]: HTMLVideoElement | null } }>(
    {},
  );
  const fullscreenVideoRef = useRef<HTMLVideoElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Enable debug mode with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update showModelSelection when modelsEnabled changes
  useEffect(() => {
    setShowModelSelection(modelsEnabled);
  }, [modelsEnabled]);

  // Scroll to bottom when new generation is added
  useEffect(() => {
    if (bottomRef.current && generations.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generations.length]);

  // Handle fullscreen video playback state
  useEffect(() => {
    if (fullscreenMedia?.type === 'video' && fullscreenMedia.generationId) {
      // When opening fullscreen video, maintain the play state from the thumbnail
      if (fullscreenVideoRef.current) {
        const videoKey = `${fullscreenMedia.generationId}-${fullscreenMedia.videoId || 0}`;
        if (isPlaying[videoKey]) {
          fullscreenVideoRef.current.play().catch(console.error);
        } else {
          fullscreenVideoRef.current.pause();
        }
      }
    }
  }, [fullscreenMedia, isPlaying]);

  // Prevent body scroll when fullscreen is active
  useEffect(() => {
    if (fullscreenMedia) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreenMedia]);

  // Handle models toggle
  const handleModelsToggle = (enabled: boolean) => {
    setModelsEnabled(enabled);
    setShowModelSelection(enabled);

    // If models are being enabled, check if there are already generations
    if (enabled && generations.length > 0) {
      setModelsEnabledAfterGenerations(true);
    } else if (!enabled) {
      // Reset when models are disabled
      setModelsEnabledAfterGenerations(false);
      setSelectedModel('fiona');
    }
  };

  // Helper function to extract image URLs from response
  const extractImageUrls = (data: any): string[] => {
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
          else if (
            Array.isArray(firstItem) &&
            firstItem.every((item) => typeof item === 'string')
          ) {
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
  };

  // Helper function to extract enhanced prompt from response
  const extractEnhancedPrompt = (data: any): string | null => {
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
  };

  // Helper function to extract exactly two image URLs and enhanced prompt from response
  const extractTwoUrlsAndPrompt = (
    data: any,
  ): { imageUrls: string[]; enhancedPrompt: string | null } => {
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
          const arrayProps = ['imageURLs', 'results', 'output', 'images', 'urls', 'imageUrls']; // Put imageURLs first

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
  };

  const handleGenerate = async () => {
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
        // Determine which webhook URL to use based on conditions
        let webhookUrl =
          'https://humanprompt.app.n8n.cloud/webhook/eff83ff9-6f5e-4786-9a2c-3d15ca5fc4ed'; // Default webhook for no style/character

        if (modelsEnabled) {
          if (selectedModel === 'fiona') {
            webhookUrl =
              'https://humanprompt.app.n8n.cloud/webhook/fd13245b-3136-40de-82cc-8d220a3758c4';
          } else if (selectedModel === 'camilla') {
            webhookUrl =
              'https://humanprompt.app.n8n.cloud/webhook/9cd5b4aa-96a3-44d7-afdb-3f5f76cea56a';
          } else if (selectedModel === 'cinematic') {
            webhookUrl =
              'https://humanprompt.app.n8n.cloud/webhook/09b186fb-af85-4632-bed9-88381b766b51';
          } else if (selectedModel === 'sketch') {
            webhookUrl =
              'https://humanprompt.app.n8n.cloud/webhook/b92deb2e-a2af-4c7e-a59e-aba30d7f1a8b';
          }
        }

        // Log to both console and debug info
        const logInfo = (message: string) => {
          console.log(message);
          setDebugInfo((prev) => ({
            ...(prev || {
              rawResponse: '',
              parsedResponse: null,
              imageUrls: [],
              enhancedPrompt: null,
              error: null,
            }),
            error: prev?.error ? `${prev.error}\n${message}` : message,
          }));
        };

        logInfo(`Sending prompt to webhook: ${webhookUrl}`);
        logInfo(`Models enabled: ${modelsEnabled}, Selected model: ${selectedModel}`);

        // Send the request to the appropriate webhook
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model: selectedModel, // Include the selected model in the request
          }),
        });

        if (response.ok) {
          logInfo('Prompt sent successfully');
          // Parse the response to get the image URLs and enhanced prompt
          const responseText = await response.text();
          logInfo('Raw webhook response received');

          // Store raw response in debug info
          setDebugInfo((prev) => ({
            ...(prev || {
              rawResponse: '',
              parsedResponse: null,
              imageUrls: [],
              enhancedPrompt: null,
              error: null,
            }),
            rawResponse: responseText,
          }));

          // Initialize variables
          let imageUrls: string[] = [];
          let enhancedPrompt: string | null = null;
          let parsedData: any = null;

          try {
            // Parse the response as JSON
            parsedData = JSON.parse(responseText);
            logInfo('Successfully parsed response as JSON');

            // Update debug info with parsed data
            setDebugInfo((prev) => ({
              ...(prev || {
                rawResponse: responseText,
                parsedResponse: null,
                imageUrls: [],
                enhancedPrompt: null,
                error: null,
              }),
              parsedResponse: parsedData,
            }));

            // Use the specialized extraction function
            const extracted = extractTwoUrlsAndPrompt(parsedData);
            imageUrls = extracted.imageUrls;
            enhancedPrompt = extracted.enhancedPrompt;

            logInfo(`Extracted ${imageUrls.length} image URLs from response`);
            logInfo(
              enhancedPrompt
                ? 'Extracted enhanced prompt from response'
                : 'No enhanced prompt found in response',
            );

            // Update debug info with extracted data
            setDebugInfo((prev) => ({
              ...(prev || {
                rawResponse: responseText,
                parsedResponse: parsedData,
                imageUrls: [],
                enhancedPrompt: null,
                error: null,
              }),
              imageUrls: imageUrls,
              enhancedPrompt: enhancedPrompt,
            }));
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            logInfo(`Failed to parse response: ${errorMessage}`);

            // Try to extract URLs directly from the response text if it's not valid JSON
            if (responseText.includes('http')) {
              const urlRegex = /(https?:\/\/[^\s"]+)/g;
              const matches = responseText.match(urlRegex);
              if (matches && matches.length > 0) {
                imageUrls = matches.slice(0, 2); // Take up to 2 URLs
                logInfo(`Extracted ${imageUrls.length} image URLs directly from response text`);
              }
            }
          }

          // Use placeholder images as fallback if no images were found
          logInfo(`Final imageUrls array length: ${imageUrls.length}`);

          if (imageUrls.length === 0) {
            logInfo(`No images found in the response, this may cause display issues`);
            // Only use a placeholder if absolutely no images were found
            imageUrls = ['/placeholder.svg?key=no-images-found'];
          } else {
            logInfo(`Using ${imageUrls.length} extracted image URL(s) directly`);
          }

          // Create a new generation object with empty videos array
          const newGeneration: Generation = {
            id: `gen_${Date.now()}`,
            prompt: prompt,
            enhancedPrompt: enhancedPrompt,
            imageUrls: imageUrls,
            videos: [], // Initialize with empty array instead of null
            processingVideoIndex: null,
            processingMode: null, // Initialize as null
            selectedImageIndex: null,
          };
          // Add the new generation to the array
          setGenerations((prevGenerations) => [...prevGenerations, newGeneration]);
          setIsGenerated(true);
          // Keep model selection visible if models are enabled
          if (modelsEnabled) {
            setShowModelSelection(true);
          }
          setPrompt('');
        } else {
          const errorMessage = `Failed to send prompt: ${response.status} ${response.statusText}`;
          logInfo(errorMessage);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error sending prompt:', errorMessage);
        setDebugInfo((prev) => ({
          ...(prev || {
            rawResponse: '',
            parsedResponse: null,
            imageUrls: [],
            enhancedPrompt: null,
            error: null,
          }),
          error: `Error sending prompt: ${errorMessage}`,
        }));
      } finally {
        setIsLoading(false);
        setIsTransitioning(false);
        setLoadingGeneration(null);
      }
    }, 500); // Short delay for animation to start
  };

  // Enhanced image download function
  const handleDownloadImage = (url: string, index: number) => {
    const downloadImage = async (imageUrl: string) => {
      try {
        // Create a temporary link to fetch the image as a blob
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Create a temporary anchor element and trigger download
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `generated-image-${index + 1}.jpg`;
        document.body.appendChild(a);
        a.click();

        // Clean up
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } catch (error) {
        console.error('Error downloading image:', error);
        alert('Failed to download image. Please try again.');
      }
    };

    downloadImage(url);
  };

  // Enhanced video download function - updated to handle multiple videos
  const handleDownloadVideo = (generationId: string, videoIndex: number) => {
    console.log('handleDownloadVideo called:', generationId, videoIndex);

    const generation = generations.find((gen) => gen.id === generationId);
    if (!generation || !generation.videos[videoIndex]) {
      console.error('Generation or video not found');
      return;
    }

    const videoUrl = generation.videos[videoIndex].url;
    console.log('Downloading video from URL:', videoUrl);

    const downloadVideo = async () => {
      try {
        const response = await fetch(videoUrl, {
          method: 'GET',
          credentials: 'omit',
          cache: 'no-cache',
        });

        console.log('Fetch response status:', response.status);
        console.log('Fetch response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        console.log('Blob created, size:', blob.size, 'type:', blob.type);

        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `generated-video-${generationId}-${videoIndex}.mp4`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        console.log('Download triggered successfully');
      } catch (error) {
        console.error('Error downloading video:', error);
        alert('Failed to download video. Please try again.');
      }
    };

    downloadVideo();
  };

  // Helper function to extract video URL from response
  const extractVideoUrl = (data: any): string | null => {
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
  };

  const handleGenerateVideo = (generationId: string, imageUrl: string, imageIndex: number) => {
    setVideoGenerationModal({
      show: true,
      generationId,
      imageUrl,
      imageIndex,
    });
  };

  const generateVideoWithMode = async (mode: 'draft' | 'advanced') => {
    if (!videoGenerationModal) return;

    const { generationId, imageUrl, imageIndex } = videoGenerationModal;

    // Close the modal
    setVideoGenerationModal(null);

    // Get the current generation to access its enhanced prompt
    const generation = generations.find((gen) => gen.id === generationId);
    if (!generation) return;

    const enhancedPrompt = generation.enhancedPrompt || null;

    // Update the generation's processing state
    setGenerations((prevGenerations) =>
      prevGenerations.map((gen) => {
        if (gen.id === generationId) {
          return {
            ...gen,
            processingVideoIndex: imageIndex,
            processingMode: mode, // Track which mode is being processed
            selectedImageIndex: imageIndex,
          };
        }
        return gen;
      }),
    );

    try {
      console.log(`Sending request to generate video in ${mode} mode from image:`, imageUrl);

      // Use different webhook URLs for draft and advanced modes
      let webhookUrl =
        mode === 'draft'
          ? 'https://humanprompt.app.n8n.cloud/webhook/241fd9df-0002-4708-ad60-b446e59feea7' // Draft mode
          : 'https://humanprompt.app.n8n.cloud/webhook/a64ecae2-2790-4f39-9134-07c20e0bf6a8'; // Advanced mode - UPDATED

      const requestBody = { imageURL: imageUrl, mode: mode };
      console.log('Request body:', requestBody);

      // For advanced mode, we'll use a different approach with polling
      if (mode === 'advanced') {
        try {
          console.log('Sending request to advanced video generation webhook');

          // Use the new webhook URL for advanced mode
          webhookUrl =
            'https://humanprompt.app.n8n.cloud/webhook/a64ecae2-2790-4f39-9134-07c20e0bf6a8';

          // Update the generation to show it's being processed
          setGenerations((prevGenerations) =>
            prevGenerations.map((gen) => {
              if (gen.id === generationId) {
                return {
                  ...gen,
                  processingVideoIndex: imageIndex,
                  processingMode: mode,
                };
              }
              return gen;
            }),
          );

          // Send the request to the webhook
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageURL: imageUrl }),
          });

          if (response.ok) {
            const responseText = await response.text();
            console.log('Advanced video generation response:', responseText);

            // Store webhook response in debug info
            setDebugInfo((prev) => ({
              ...(prev || {
                rawResponse: '',
                parsedResponse: null,
                imageUrls: [],
                enhancedPrompt: null,
                error: null,
                webhookResponses: [],
              }),
              webhookResponses: [
                ...(prev?.webhookResponses || []),
                { type: 'advanced_init', response: responseText },
              ],
            }));

            try {
              // Try to parse the response as JSON
              const parsedData = JSON.parse(responseText);
              console.log('Parsed advanced video response:', parsedData);

              // For advanced mode, we expect both request_id and content in the initial response
              if (!parsedData.request_id) {
                console.error('No request_id found in advanced video response');

                // Add a new error video to the videos array instead of setting an error
                setGenerations((prevGenerations) =>
                  prevGenerations.map((gen) => {
                    if (gen.id === generationId) {
                      return {
                        ...gen,
                        videos: [
                          ...gen.videos,
                          {
                            url: '', // Empty URL for error
                            mode: 'advanced',
                            enhancedPrompt: null,
                            advancedPrompt: null, // Add this line
                            error: 'Invalid response from server: missing request_id',
                            timestamp: Date.now(),
                          },
                        ],
                        processingVideoIndex: null,
                        processingMode: null,
                      };
                    }
                    return gen;
                  }),
                );
                return;
              }

              // Extract the content (prompt used) from the response
              const advancedPrompt = parsedData.content || null;
              console.log(
                `Received request_id: ${parsedData.request_id} and content: ${advancedPrompt} for advanced video generation`,
              );

              console.log(
                `Received request_id: ${parsedData.request_id} for advanced video generation`,
              );

              // Update the generation to show it's being processed with the request ID
              setGenerations((prevGenerations) =>
                prevGenerations.map((gen) => {
                  if (gen.id === generationId) {
                    return {
                      ...gen,
                      processingVideoIndex: imageIndex,
                      processingMode: mode,
                    };
                  }
                  return gen;
                }),
              );

              // Create a function to poll the status check webhook
              const pollStatusCheck = async () => {
                console.log(`Polling for request_id: ${parsedData.request_id}`);
                try {
                  const statusCheckWebhookUrl =
                    'https://humanprompt.app.n8n.cloud/webhook/699f1cc7-7f9e-4008-aa82-e01a683fb38d';
                  const statusResponse = await fetch(statusCheckWebhookUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(parsedData),
                  });

                  if (statusResponse.ok) {
                    const statusText = await statusResponse.text();
                    console.log('Status Check webhook response:', statusText);

                    // Store webhook response in debug info
                    setDebugInfo((prev) => ({
                      ...(prev || {
                        rawResponse: '',
                        parsedResponse: null,
                        imageUrls: [],
                        enhancedPrompt: null,
                        error: null,
                        webhookResponses: [],
                      }),
                      webhookResponses: [
                        ...(prev?.webhookResponses || []),
                        { type: 'status_check', response: statusText },
                      ],
                    }));

                    try {
                      const statusData = JSON.parse(statusText);
                      console.log('Parsed status check response:', statusData);

                      // Check if the video is ready
                      if (statusData.status === 'COMPLETED') {
                        console.log('Video generation completed! Sending to final webhook');

                        // Send to the final webhook to get the video URL
                        const finalWebhookUrl =
                          'https://humanprompt.app.n8n.cloud/webhook/82328e89-b6f3-4549-a375-d3d7e9f1f4d4';
                        const finalResponse = await fetch(finalWebhookUrl, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(parsedData),
                        });

                        if (finalResponse.ok) {
                          const finalResponseText = await finalResponse.text();
                          console.log('Final webhook response:', finalResponseText);

                          // Store webhook response in debug info
                          setDebugInfo((prev) => ({
                            ...(prev || {
                              rawResponse: '',
                              parsedResponse: null,
                              imageUrls: [],
                              enhancedPrompt: null,
                              error: null,
                              webhookResponses: [],
                            }),
                            webhookResponses: [
                              ...(prev?.webhookResponses || []),
                              { type: 'final_webhook', response: finalResponseText },
                            ],
                          }));

                          try {
                            const finalJsonResponse = JSON.parse(finalResponseText);
                            console.log('Final webhook JSON response:', finalJsonResponse);

                            // Extract video URL from the final response
                            const videoUrl = extractVideoUrl(finalJsonResponse);

                            if (videoUrl) {
                              console.log(
                                'Extracted video URL from final webhook response:',
                                videoUrl,
                              );

                              // Add the new video to the videos array instead of replacing
                              setGenerations((prevGenerations) =>
                                prevGenerations.map((gen) => {
                                  if (gen.id === generationId) {
                                    return {
                                      ...gen,
                                      videos: [
                                        ...gen.videos,
                                        {
                                          url: videoUrl,
                                          mode: 'advanced',
                                          enhancedPrompt: enhancedPrompt,
                                          advancedPrompt: advancedPrompt, // Add this line
                                          error: null,
                                          timestamp: Date.now(),
                                        },
                                      ],
                                      processingVideoIndex: null,
                                      processingMode: null,
                                    };
                                  }
                                  return gen;
                                }),
                              );
                            } else {
                              console.warn('No video URL found in final webhook response');

                              // Add an error video to the videos array
                              setGenerations((prevGenerations) =>
                                prevGenerations.map((gen) => {
                                  if (gen.id === generationId) {
                                    return {
                                      ...gen,
                                      videos: [
                                        ...gen.videos,
                                        {
                                          url: '', // Empty URL for error
                                          mode: 'advanced',
                                          enhancedPrompt: null,
                                          advancedPrompt: advancedPrompt, // Add this line
                                          error: 'No video URL received from final webhook',
                                          timestamp: Date.now(),
                                        },
                                      ],
                                      processingVideoIndex: null,
                                      processingMode: null,
                                    };
                                  }
                                  return gen;
                                }),
                              );
                            }
                          } catch (e) {
                            console.log('Final webhook response is not JSON');

                            // Check if the raw response might be a URL
                            if (finalResponseText.trim().startsWith('http')) {
                              // Use the raw response as the video URL
                              setGenerations((prevGenerations) =>
                                prevGenerations.map((gen) => {
                                  if (gen.id === generationId) {
                                    return {
                                      ...gen,
                                      videos: [
                                        ...gen.videos,
                                        {
                                          url: finalResponseText.trim(),
                                          mode: 'advanced',
                                          enhancedPrompt: enhancedPrompt,
                                          advancedPrompt: advancedPrompt, // Add this line
                                          error: null,
                                          timestamp: Date.now(),
                                        },
                                      ],
                                      processingVideoIndex: null,
                                      processingMode: null,
                                    };
                                  }
                                  return gen;
                                }),
                              );
                            } else {
                              // Add an error video
                              setGenerations((prevGenerations) =>
                                prevGenerations.map((gen) => {
                                  if (gen.id === generationId) {
                                    return {
                                      ...gen,
                                      videos: [
                                        ...gen.videos,
                                        {
                                          url: '', // Empty URL for error
                                          mode: 'advanced',
                                          enhancedPrompt: null,
                                          advancedPrompt: advancedPrompt, // Add this line
                                          error: 'Failed to process final webhook response',
                                          timestamp: Date.now(),
                                        },
                                      ],
                                      processingVideoIndex: null,
                                      processingMode: null,
                                    };
                                  }
                                  return gen;
                                }),
                              );
                            }
                          }
                        } else {
                          console.error(
                            'Failed to send to final webhook. Status:',
                            finalResponse.status,
                          );

                          // Add an error video
                          setGenerations((prevGenerations) =>
                            prevGenerations.map((gen) => {
                              if (gen.id === generationId) {
                                return {
                                  ...gen,
                                  videos: [
                                    ...gen.videos,
                                    {
                                      url: '', // Empty URL for error
                                      mode: 'advanced',
                                      enhancedPrompt: null,
                                      advancedPrompt: advancedPrompt, // Add this line
                                      error: `Final webhook returned an error: ${finalResponse.status}`,
                                      timestamp: Date.now(),
                                    },
                                  ],
                                  processingVideoIndex: null,
                                  processingMode: null,
                                };
                              }
                              return gen;
                            }),
                          );
                        }

                        return true; // Polling complete
                      } else {
                        console.log(
                          'Video generation still in progress, will check again in 30 seconds',
                        );

                        // Update the generation with status information
                        setGenerations((prevGenerations) =>
                          prevGenerations.map((gen) => {
                            if (gen.id === generationId) {
                              return {
                                ...gen,
                                processingVideoIndex: imageIndex,
                                processingMode: mode,
                              };
                            }
                            return gen;
                          }),
                        );

                        return false; // Continue polling
                      }
                    } catch (e) {
                      console.log(
                        'Status Check webhook response is not JSON, will continue polling',
                      );
                      return false; // Continue polling
                    }
                  } else {
                    console.error(
                      'Failed to send to Status Check webhook. Status:',
                      statusResponse.status,
                    );
                    return false; // Continue polling despite error
                  }
                } catch (error) {
                  console.error('Error sending to Status Check webhook:', error);
                  return false; // Continue polling despite error
                }
              };

              // Start the polling process with a maximum timeout
              const maxPollingTime = 10 * 60 * 1000; // 10 minutes
              const startTime = Date.now();

              // Start the polling process
              const startPolling = () => {
                // Check if we've exceeded the maximum polling time
                if (Date.now() - startTime > maxPollingTime) {
                  console.log('Exceeded maximum polling time of 10 minutes');

                  // Add an error video
                  setGenerations((prevGenerations) =>
                    prevGenerations.map((gen) => {
                      if (gen.id === generationId) {
                        return {
                          ...gen,
                          videos: [
                            ...gen.videos,
                            {
                              url: '', // Empty URL for error
                              mode: 'advanced',
                              enhancedPrompt: null,
                              advancedPrompt: null, // Add this line
                              error: 'Video generation timed out after 10 minutes',
                              timestamp: Date.now(),
                            },
                          ],
                          processingVideoIndex: null,
                          processingMode: null,
                        };
                      }
                      return gen;
                    }),
                  );
                  return;
                }

                pollStatusCheck().then((isComplete) => {
                  if (!isComplete) {
                    // Schedule next poll in 30 seconds
                    console.log('Scheduling next status check in 30 seconds');
                    setTimeout(startPolling, 30000);
                  }
                });
              };

              // Start the first poll immediately
              startPolling();
            } catch (error) {
              console.error('Error parsing advanced video response:', error);

              // Add an error video
              setGenerations((prevGenerations) =>
                prevGenerations.map((gen) => {
                  if (gen.id === generationId) {
                    return {
                      ...gen,
                      videos: [
                        ...gen.videos,
                        {
                          url: '', // Empty URL for error
                          mode: 'advanced',
                          enhancedPrompt: null,
                          advancedPrompt: null, // Add this line
                          error: 'Failed to parse server response',
                          timestamp: Date.now(),
                        },
                      ],
                      processingVideoIndex: null,
                      processingMode: null,
                    };
                  }
                  return gen;
                }),
              );
            }
          } else {
            console.error('Advanced video generation request failed:', response.status);

            // Add an error video
            setGenerations((prevGenerations) =>
              prevGenerations.map((gen) => {
                if (gen.id === generationId) {
                  return {
                    ...gen,
                    videos: [
                      ...gen.videos,
                      {
                        url: '', // Empty URL for error
                        mode: 'advanced',
                        enhancedPrompt: null,
                        advancedPrompt: null, // Add this line
                        error: `Server error: ${response.status}`,
                        timestamp: Date.now(),
                      },
                    ],
                    processingVideoIndex: null,
                    processingMode: null,
                  };
                }
                return gen;
              }),
            );
          }
        } catch (error) {
          console.error('Error during advanced video generation:', error);

          // Add an error video
          setGenerations((prevGenerations) =>
            prevGenerations.map((gen) => {
              if (gen.id === generationId) {
                return {
                  ...gen,
                  videos: [
                    ...gen.videos,
                    {
                      url: '', // Empty URL for error
                      mode: 'advanced',
                      enhancedPrompt: null,
                      advancedPrompt: null, // Add this line
                      error: 'Network error during video generation',
                      timestamp: Date.now(),
                    },
                  ],
                  processingVideoIndex: null,
                  processingMode: null,
                };
              }
              return gen;
            }),
          );
        }

        // Return early for advanced mode since we've handled it separately
        return;
      }

      // For draft mode, continue with the existing implementation
      // Set up AbortController with a timeout for draft mode
      const controller = new AbortController();
      const timeoutDuration = 3 * 60 * 1000; // 3 minutes for draft mode

      // Log the expected wait time
      console.log(`Setting timeout for ${mode} mode to ${timeoutDuration / 60000} minutes`);

      // Create a timeout that will abort the fetch after the specified duration
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log(`Request timed out after ${timeoutDuration / 60000} minutes`);
      }, timeoutDuration);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        // Clear the timeout since we got a response
        clearTimeout(timeoutId);

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          // Get the raw text first for logging
          const responseText = await response.text();
          console.log(`${mode} video generation raw response:`, responseText);

          // Store webhook response in debug info
          setDebugInfo((prev) => ({
            ...(prev || {
              rawResponse: '',
              parsedResponse: null,
              imageUrls: [],
              enhancedPrompt: null,
              error: null,
              webhookResponses: [],
            }),
            webhookResponses: [
              ...(prev?.webhookResponses || []),
              { type: `${mode}_video`, response: responseText },
            ],
          }));

          // Try to parse as JSON
          let parsedData;
          let videoUrl = null;
          let videoEnhancedPrompt = null;

          try {
            parsedData = JSON.parse(responseText);
            console.log(`${mode} video generation response (parsed):`, parsedData);

            // Extract the video URL from the parsed response
            videoUrl = extractVideoUrl(parsedData);
            console.log('Extracted video URL:', videoUrl);

            // Extract enhanced prompt from the video generation response
            videoEnhancedPrompt = extractEnhancedPrompt(parsedData);
            console.log('Extracted video enhanced prompt:', videoEnhancedPrompt);
          } catch (e) {
            console.error('Failed to parse response as JSON:', e);
            console.log('Using raw response text instead');

            // If it's not JSON, check if the raw text is a URL
            if (responseText.trim().startsWith('http')) {
              videoUrl = responseText.trim();
              console.log('Using raw response as video URL:', videoUrl);
            } else {
              // Try to extract URL from the text using regex
              const urlRegex = /(https?:\/\/[^\s"]+)/g;
              const matches = responseText.match(urlRegex);
              if (matches && matches.length > 0) {
                videoUrl = matches[0];
                console.log('Extracted video URL from text using regex:', videoUrl);
              }
            }
          }

          if (videoUrl) {
            console.log(`${mode} mode final video URL:`, videoUrl);

            // Add the new video to the videos array instead of replacing
            setGenerations((prevGenerations) =>
              prevGenerations.map((gen) => {
                if (gen.id === generationId) {
                  return {
                    ...gen,
                    videos: [
                      ...gen.videos,
                      {
                        url: videoUrl!,
                        mode: mode,
                        enhancedPrompt: videoEnhancedPrompt || enhancedPrompt,
                        advancedPrompt: null, // Add this line for draft mode
                        error: null,
                        timestamp: Date.now(),
                      },
                    ],
                    processingVideoIndex: null,
                    processingMode: null,
                  };
                }
                return gen;
              }),
            );
          } else {
            console.warn(`${mode} mode: No video URL found in response`);

            // Add an error video
            setGenerations((prevGenerations) =>
              prevGenerations.map((gen) => {
                if (gen.id === generationId) {
                  return {
                    ...gen,
                    videos: [
                      ...gen.videos,
                      {
                        url: '', // Empty URL for error
                        mode: mode,
                        enhancedPrompt: null,
                        advancedPrompt: null, // Add this line
                        error: 'no video url received from server',
                        timestamp: Date.now(),
                      },
                    ],
                    processingVideoIndex: null,
                    processingMode: null,
                  };
                }
                return gen;
              }),
            );
          }
        } else {
          console.error(
            `${mode} mode: Failed to send image URL for video generation. Status: ${response.status}`,
          );

          // Add an error video
          setGenerations((prevGenerations) =>
            prevGenerations.map((gen) => {
              if (gen.id === generationId) {
                return {
                  ...gen,
                  videos: [
                    ...gen.videos,
                    {
                      url: '', // Empty URL for error
                      mode: mode,
                      enhancedPrompt: null,
                      advancedPrompt: null, // Add this line
                      error: 'failed to generate video. server returned an error.',
                      timestamp: Date.now(),
                    },
                  ],
                  processingVideoIndex: null,
                  processingMode: null,
                };
              }
              return gen;
            }),
          );
        }
      } catch (error) {
        // Clear the timeout if there's an error
        clearTimeout(timeoutId);

        // Check if the error is due to timeout/abort
        if (error.name === 'AbortError') {
          console.error(`${mode} mode: Request timed out after ${timeoutDuration / 60000} minutes`);

          // Add an error video
          setGenerations((prevGenerations) =>
            prevGenerations.map((gen) => {
              if (gen.id === generationId) {
                return {
                  ...gen,
                  videos: [
                    ...gen.videos,
                    {
                      url: '', // Empty URL for error
                      mode: mode,
                      enhancedPrompt: null,
                      advancedPrompt: null, // Add this line
                      error: `video generation is taking longer than expected. please check back later.`,
                      timestamp: Date.now(),
                    },
                  ],
                  processingVideoIndex: null,
                  processingMode: null,
                };
              }
              return gen;
            }),
          );
        } else {
          console.error(`${mode} mode: Error sending image URL for video generation:`, error);

          // Add an error video
          setGenerations((prevGenerations) =>
            prevGenerations.map((gen) => {
              if (gen.id === generationId) {
                return {
                  ...gen,
                  videos: [
                    ...gen.videos,
                    {
                      url: '', // Empty URL for error
                      mode: mode,
                      enhancedPrompt: null,
                      advancedPrompt: null, // Add this line
                      error: 'an error occurred while trying to generate the video.',
                      timestamp: Date.now(),
                    },
                  ],
                  processingVideoIndex: null,
                  processingMode: null,
                };
              }
              return gen;
            }),
          );
        }
      }
    } catch (error) {
      console.error('Error in video generation process:', error);

      // Add an error video
      setGenerations((prevGenerations) =>
        prevGenerations.map((gen) => {
          if (gen.id === generationId) {
            return {
              ...gen,
              videos: [
                ...gen.videos,
                {
                  url: '', // Empty URL for error
                  mode: mode,
                  enhancedPrompt: null,
                  advancedPrompt: null, // Add this line
                  error: 'an error occurred while trying to generate the video.',
                  timestamp: Date.now(),
                },
              ],
              processingVideoIndex: null,
              processingMode: null,
            };
          }
          return gen;
        }),
      );
    }
  };

  // Render video generation mode selection modal
  const renderVideoGenerationModal = () => {
    if (!videoGenerationModal?.show) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
        <div className="bg-[#101218] rounded-lg p-8 max-w-5xl w-full">
          <div className="grid grid-cols-2 gap-8 mb-8 relative">
            <h2 className="text-3xl text-white text-center">Draft Mode</h2>
            <h2 className="text-3xl text-white text-center">Advanced Mode</h2>
            <button
              className="absolute top-0 right-0 text-white hover:text-gray-300"
              onClick={() => setVideoGenerationModal(null)}
            >
              <X size={32} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Draft Mode */}
            <div className="bg-[#1E1E1E] rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <p className="text-white text-lg">speed: generates videos in around 2 minutes</p>
                </div>
                <div>
                  <p className="text-white text-lg">
                    quality: may include visual artefacts or imperfections; ideal for rapid concept
                    testing
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => generateVideoWithMode('draft')}
                  className="bg-white text-black font-medium py-3 px-8 rounded-full hover:bg-gray-200 transition-colors"
                >
                  generate video
                </button>
              </div>
            </div>

            {/* Advanced Mode */}
            <div className="bg-[#1E1E1E] rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <p className="text-white text-lg">
                    speed: generates videos in approximately 7 minutes
                  </p>
                </div>
                <div>
                  <p className="text-white text-lg">
                    quality: fewer visual artefacts, offering higher accuracy and
                    professional-quality outputs
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => generateVideoWithMode('advanced')}
                  className="bg-white text-black font-medium py-3 px-8 rounded-full hover:bg-gray-200 transition-colors"
                >
                  generate video
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Updated to handle multiple videos
  const togglePlayPause = (generationId: string, videoIndex: number) => {
    // Create a unique key for each video
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
        // Update the generation with an error
        setGenerations((prevGenerations) =>
          prevGenerations.map((gen) => {
            if (gen.id === generationId) {
              const updatedVideos = [...gen.videos];
              if (updatedVideos[videoIndex]) {
                updatedVideos[videoIndex] = {
                  ...updatedVideos[videoIndex],
                  error: 'could not play video: ' + error.message,
                  advancedPrompt: null,
                };
              }
              return {
                ...gen,
                videos: updatedVideos,
              };
            }
            return gen;
          }),
        );
      });
    }

    setIsPlaying((prev) => ({
      ...prev,
      [videoKey]: !prev[videoKey],
    }));
  };

  // Function to handle video errors - updated for multiple videos
  const handleVideoError = (
    generationId: string,
    videoIndex: number,
    e: React.SyntheticEvent<HTMLVideoElement, Event>,
  ) => {
    console.error('Video error:', e);

    // Create a unique key for each video
    const videoKey = `${generationId}-${videoIndex}`;

    // Update the generation with an error
    setGenerations((prevGenerations) =>
      prevGenerations.map((gen) => {
        if (gen.id === generationId) {
          const updatedVideos = [...gen.videos];
          if (updatedVideos[videoIndex]) {
            updatedVideos[videoIndex] = {
              ...updatedVideos[videoIndex],
              error: 'failed to load video. the format may be unsupported or the url is invalid.',
              advancedPrompt: null,
            };
          }
          return {
            ...gen,
            videos: updatedVideos,
          };
        }
        return gen;
      }),
    );

    setIsPlaying((prev) => ({
      ...prev,
      [videoKey]: false,
    }));
  };

  // Function to toggle model selection
  const toggleModelSelection = (modelId: string) => {
    setSelectedModel(modelId);
  };

  // Function to open fullscreen view - updated for multiple videos
  const openFullscreenMedia = (
    type: 'image' | 'video',
    url: string,
    generationId?: string,
    videoId?: number,
  ) => {
    setFullscreenMedia({ type, url, generationId, videoId });
  };

  // Function to close fullscreen view
  const closeFullscreenMedia = () => {
    setFullscreenMedia(null);
  };

  // Function to toggle fullscreen video playback - updated for multiple videos
  const toggleFullscreenVideo = () => {
    if (
      !fullscreenMedia?.type === 'video' ||
      !fullscreenMedia.generationId ||
      !fullscreenVideoRef.current
    )
      return;

    const videoKey = `${fullscreenMedia.generationId}-${fullscreenMedia.videoId || 0}`;

    if (isPlaying[videoKey]) {
      fullscreenVideoRef.current.pause();
    } else {
      fullscreenVideoRef.current.play().catch(console.error);
    }

    setIsPlaying((prev) => ({
      ...prev,
      [videoKey]: !prev[videoKey],
    }));
  };

  // Function to show the appropriate enhanced prompt
  const showAppropriateEnhancedPrompt = (generation: Generation, videoIndex?: number) => {
    if (videoIndex !== undefined && generation.videos[videoIndex]) {
      const video = generation.videos[videoIndex];
      // For advanced videos, prioritize the advanced prompt if available
      if (video.mode === 'advanced' && video.advancedPrompt) {
        setShowEnhancedPrompt(video.advancedPrompt);
      } else if (video.enhancedPrompt) {
        setShowEnhancedPrompt(video.enhancedPrompt);
      } else if (generation.enhancedPrompt) {
        setShowEnhancedPrompt(generation.enhancedPrompt);
      } else {
        setShowEnhancedPrompt('No enhanced prompt available for this generation.');
      }
    } else if (generation.enhancedPrompt) {
      setShowEnhancedPrompt(generation.enhancedPrompt);
    } else {
      setShowEnhancedPrompt('No enhanced prompt available for this generation.');
    }
  };

  // Animated ellipsis component for the loading state
  const AnimatedEllipsis = () => (
    <span className="ellipsis-container">
      <span className="animate-dot-1">.</span>
      <span className="animate-dot-2">.</span>
      <span className="animate-dot-3">.</span>
    </span>
  );

  // Render debug panel
  const renderDebugPanel = () => {
    if (!debugMode || !debugInfo) return null;

    return (
      <div className="fixed top-0 right-0 w-1/2 h-full bg-black bg-opacity-90 z-50 overflow-auto p-4 text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Debug Information</h2>
          <button onClick={() => setDebugMode(false)} className="text-white hover:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {debugInfo.error && (
            <div className="bg-red-900 bg-opacity-50 p-4 rounded">
              <h3 className="font-bold mb-2">Errors:</h3>
              <pre className="whitespace-pre-wrap text-sm">{debugInfo.error}</pre>
            </div>
          )}

          <div>
            <h3 className="font-bold mb-2">Image URLs:</h3>
            {debugInfo.imageUrls && debugInfo.imageUrls.length > 0 ? (
              <ul className="list-disc pl-5">
                {debugInfo.imageUrls.map((url, index) => (
                  <li key={index} className="break-all text-sm">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-red-400">No image URLs found</p>
            )}
          </div>

          <div>
            <h3 className="font-bold mb-2">Enhanced Prompt:</h3>
            {debugInfo.enhancedPrompt ? (
              <div className="bg-gray-800 p-3 rounded text-sm">{debugInfo.enhancedPrompt}</div>
            ) : (
              <p className="text-red-400">No enhanced prompt found</p>
            )}
          </div>

          {debugInfo.webhookResponses && debugInfo.webhookResponses.length > 0 && (
            <div>
              <h3 className="font-bold mb-2">Webhook Responses:</h3>
              <div className="space-y-2">
                {debugInfo.webhookResponses.map((response, index) => (
                  <div key={index} className="bg-gray-800 p-3 rounded">
                    <h4 className="font-semibold mb-1">
                      {response.type || `Response ${index + 1}`}:
                    </h4>
                    <pre className="text-xs overflow-auto max-h-40">{response.response}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-bold mb-2">Parsed Response:</h3>
            {debugInfo.parsedResponse ? (
              <pre className="bg-gray-800 p-3 rounded overflow-auto max-h-40 text-sm">
                {JSON.stringify(debugInfo.parsedResponse, null, 2)}
              </pre>
            ) : (
              <p className="text-red-400">Failed to parse response</p>
            )}
          </div>

          <div>
            <h3 className="font-bold mb-2">Raw Response:</h3>
            <pre className="bg-gray-800 p-3 rounded overflow-auto max-h-40 text-sm">
              {debugInfo.rawResponse || 'No raw response available'}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  // Update the renderFullSizeModelSelection function to display models and styles side by side
  const renderFullSizeModelSelection = () => {
    // Group models by category
    const modelsByCategory = models.reduce(
      (acc, model) => {
        if (!acc[model.category]) {
          acc[model.category] = [];
        }
        acc[model.category].push(model);
        return acc;
      },
      {} as Record<string, typeof models>,
    );

    return (
      <div className="flex-grow flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-6xl w-full">
          <div className="flex justify-between mb-12">
            {/* Models section */}
            <div className="w-1/2 px-4">
              <h2 className="text-4xl text-white mb-8 text-center">models</h2>
              <div className="flex justify-evenly">
                {modelsByCategory['models']?.map((model) => (
                  <div key={model.id} className="flex flex-col items-center">
                    <div className="rounded-lg overflow-hidden mb-4 w-48 h-48 flex items-center justify-center bg-[#1E1E1E]">
                      <div className="relative w-full h-full">
                        <Image
                          src={model.imageUrl || '/placeholder.svg'}
                          alt={model.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={selectedModel === model.id}
                        onCheckedChange={() => toggleModelSelection(model.id)}
                      />
                      <span className="text-xl text-white">{model.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Styles section */}
            <div className="w-1/2 px-4">
              <h2 className="text-4xl text-white mb-8 text-center">styles</h2>
              <div className="flex justify-evenly">
                {modelsByCategory['styles']?.map((model) => (
                  <div key={model.id} className="flex flex-col items-center">
                    <div className="rounded-lg overflow-hidden mb-4 w-48 h-48 flex items-center justify-center bg-[#1E1E1E]">
                      <div className="relative w-full h-full">
                        <Image
                          src={model.imageUrl || '/placeholder.svg'}
                          alt={model.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={selectedModel === model.id}
                        onCheckedChange={() => toggleModelSelection(model.id)}
                      />
                      <span className="text-xl text-white">{model.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the renderModelSelection function (compact version) to group by category
  const renderModelSelection = () => {
    // Group models by category
    const modelsByCategory = models.reduce(
      (acc, model) => {
        if (!acc[model.category]) {
          acc[model.category] = [];
        }
        acc[model.category].push(model);
        return acc;
      },
      {} as Record<string, typeof models>,
    );

    return (
      <div className="w-full px-4 mb-4">
        <hr className="border-gray-700 mb-6" />

        <div className="flex justify-between">
          {/* Models section */}
          <div className="w-1/2 px-4">
            <h3 className="text-3xl text-white mb-6 text-center">models</h3>
            <div className="flex justify-evenly">
              {modelsByCategory['models']?.map((model) => (
                <div key={model.id} className="flex flex-col items-center min-w-[120px]">
                  <div className="rounded-lg overflow-hidden mb-3 w-32 h-32 flex items-center justify-center bg-[#1E1E1E]">
                    <div className="relative w-full h-full">
                      <Image
                        src={model.imageUrl || '/placeholder.svg'}
                        alt={model.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedModel === model.id}
                      onCheckedChange={() => toggleModelSelection(model.id)}
                    />
                    <span className="text-sm text-white">{model.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Styles section */}
          <div className="w-1/2 px-4">
            <h3 className="text-3xl text-white mb-6 text-center">styles</h3>
            <div className="flex justify-evenly">
              {modelsByCategory['styles']?.map((model) => (
                <div key={model.id} className="flex flex-col items-center min-w-[120px]">
                  <div className="rounded-lg overflow-hidden mb-3 w-32 h-32 flex items-center justify-center bg-[#1E1E1E]">
                    <div className="relative w-full h-full">
                      <Image
                        src={model.imageUrl || '/placeholder.svg'}
                        alt={model.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={selectedModel === model.id}
                      onCheckedChange={() => toggleModelSelection(model.id)}
                    />
                    <span className="text-sm text-white">{model.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render loading placeholders
  const renderLoadingPlaceholders = () => (
    <div className="w-full flex flex-col items-end mb-16 px-4">
      {/* Prompt display */}
      <div className="mt-8 text-right animate-fade-in-up">
        <div className="inline-block bg-prompt-tag bg-opacity-70 rounded-full px-8 py-3 text-prompt-text">
          {loadingGeneration?.prompt}
        </div>
      </div>

      {/* Loading video animation instead of skeleton - now showing two videos */}
      <div className="w-full max-w-6xl mt-8 animate-fade-in-up">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
            <video
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Generating%20Video-JTTbLaCYi9LbW4EROlqmzzA2XpVTfq.mp4"
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
          <div className="aspect-[16/9] relative overflow-hidden rounded-lg">
            <video
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Generating%20Video-JTTbLaCYi9LbW4EROlqmzzA2XpVTfq.mp4"
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      </div>

      {/* Click instruction */}
      <div className="text-right text-white mt-4 mb-8 animate-fade-in-up">generating images...</div>
    </div>
  );

  // Render a single generation - updated to handle multiple videos
  const renderGeneration = (generation: Generation) => (
    <div
      key={generation.id}
      className="w-full flex flex-col items-end mb-16 px-4 animate-chat-message"
    >
      {/* Prompt display */}
      <div className="mt-8 text-right">
        <div
          className="inline-block bg-prompt-tag bg-opacity-70 rounded-full px-8 py-3 text-prompt-text cursor-pointer hover:bg-opacity-90 transition-colors"
          onClick={() => showAppropriateEnhancedPrompt(generation)}
        >
          {generation.prompt}
        </div>
        <div className="text-gray-400 text-sm mt-1">
          {generation.enhancedPrompt
            ? 'click to see enhanced prompt'
            : 'no enhanced prompt available'}
        </div>
      </div>

      {/* Generated images */}
      <div className="w-full max-w-6xl mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {generation.imageUrls.map((url, index) => (
            <div
              key={`${generation.id}-img-${index}`}
              className="aspect-[16/9] relative overflow-hidden rounded-lg group cursor-pointer"
              onMouseEnter={() =>
                setHoveredImage({ generationId: generation.id, imageIndex: index })
              }
              onMouseLeave={() => setHoveredImage(null)}
              onClick={() => openFullscreenMedia('image', url)}
            >
              <Image
                src={url || '/placeholder.svg?height=600&width=800&query=loading image'}
                alt={`generated image ${index + 1}`}
                width={800}
                height={600}
                className="w-full h-full object-cover"
              />

              {/* Processing overlay - only show indicator, don't cover the entire image */}
              {generation.processingVideoIndex === index && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 py-2 px-4">
                  <p className="text-white text-center">
                    {generation.processingMode === 'advanced'
                      ? 'Processing this image for advanced video...'
                      : 'Processing this image for draft video...'}
                  </p>
                </div>
              )}

              {/* Hover overlay with options */}
              <div
                className={`absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 transform transition-transform duration-200 ${
                  hoveredImage?.generationId === generation.id && hoveredImage?.imageIndex === index
                    ? 'translate-y-0'
                    : 'translate-y-full'
                }`}
                onClick={(e) => e.stopPropagation()} // Prevent opening fullscreen when clicking controls
              >
                <div className="flex justify-center space-x-6">
                  <button
                    onClick={() => handleGenerateVideo(generation.id, url, index)}
                    disabled={generation.processingVideoIndex !== null}
                    className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Film size={18} />
                    <span>generate video from image</span>
                  </button>

                  <button
                    onClick={() => handleDownloadImage(url, index)}
                    className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
                  >
                    <Download size={18} />
                    <span>download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Click instruction */}
      <div className="text-right text-white mt-4 mb-8">
        click the image you'd like to turn into a video
      </div>

      {/* Render all videos for this generation - sorted by timestamp (oldest first) */}
      {generation.videos.length > 0 && (
        <div className="w-full max-w-6xl mt-4 space-y-8">
          {generation.videos
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((video, videoIndex) => (
              <div key={`${generation.id}-video-${videoIndex}`} className="mb-8 relative">
                {/* Video title with mode */}
                <h3 className="text-white text-xl mb-2 font-medium">
                  {video.mode === 'advanced' ? 'Advanced Video' : 'Draft Video'}
                </h3>

                {/* Video player or error message */}
                {video.error ? (
                  <div className="w-full bg-input bg-opacity-30 rounded-lg p-8">
                    <div className="flex flex-col items-center text-center">
                      <AlertCircle size={48} className="text-red-400 mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">video error</h3>
                      <p className="text-gray-300">{video.error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video relative overflow-hidden rounded-lg cursor-pointer">
                    <video
                      ref={(el) => {
                        // Initialize the refs object for this generation if needed
                        if (!videoRefs.current[generation.id]) {
                          videoRefs.current[generation.id] = {};
                        }
                        videoRefs.current[generation.id][videoIndex] = el;
                      }}
                      src={video.url}
                      className="w-full h-full object-cover"
                      onPlay={() => {
                        const videoKey = `${generation.id}-${videoIndex}`;
                        setIsPlaying((prev) => ({ ...prev, [videoKey]: true }));
                      }}
                      onPause={() => {
                        const videoKey = `${generation.id}-${videoIndex}`;
                        setIsPlaying((prev) => ({ ...prev, [videoKey]: false }));
                      }}
                      onEnded={() => {
                        const videoKey = `${generation.id}-${videoIndex}`;
                        setIsPlaying((prev) => ({ ...prev, [videoKey]: false }));
                      }}
                      onError={(e) => handleVideoError(generation.id, videoIndex, e)}
                      loop
                      playsInline
                      onClick={() =>
                        openFullscreenMedia('video', video.url, generation.id, videoIndex)
                      }
                    />

                    {/* Play/Pause button overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening fullscreen when clicking play button
                        togglePlayPause(generation.id, videoIndex);
                      }}
                    >
                      {!isPlaying[`${generation.id}-${videoIndex}`] && (
                        <div className="bg-white bg-opacity-70 rounded-full p-4">
                          <Play size={32} className="text-black" />
                        </div>
                      )}
                    </div>

                    {/* Video controls */}
                    <div
                      className="absolute bottom-4 right-4 flex items-center gap-3"
                      onClick={(e) => e.stopPropagation()} // Prevent opening fullscreen when clicking controls
                    >
                      <button
                        onClick={() => handleDownloadVideo(generation.id, videoIndex)}
                        className="bg-prompt-tag bg-opacity-70 rounded-lg px-4 py-2 text-prompt-text flex items-center gap-2 hover:bg-opacity-90 transition-colors"
                      >
                        <Download size={16} />
                        <span>download</span>
                      </button>

                      <button
                        onClick={() => showAppropriateEnhancedPrompt(generation, videoIndex)}
                        className="bg-prompt-tag bg-opacity-70 rounded-lg px-4 py-2 text-prompt-text hover:bg-opacity-90 transition-colors"
                      >
                        prompt used
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Video processing indicator - MOVED to appear after all existing videos */}
      {generation.processingVideoIndex !== null && (
        <div className="w-full max-w-6xl mt-4 mb-8 relative">
          <div className="aspect-video relative overflow-hidden rounded-lg">
            <video
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Generating%20Video-JTTbLaCYi9LbW4EROlqmzzA2XpVTfq.mp4"
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          </div>
        </div>
      )}
    </div>
  );

  // Render fullscreen media view - updated for multiple videos
  const renderFullscreenMedia = () => {
    if (!fullscreenMedia) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
        onClick={closeFullscreenMedia}
      >
        <button
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          onClick={closeFullscreenMedia}
        >
          <X size={32} />
        </button>

        {fullscreenMedia.type === 'image' ? (
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <Image
              src={fullscreenMedia.url || '/placeholder.svg'}
              alt="fullscreen image"
              width={1920}
              height={1080}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        ) : (
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="relative">
              <video
                ref={fullscreenVideoRef}
                src={fullscreenMedia.url}
                className="max-w-full max-h-[90vh] object-contain"
                onPlay={() => {
                  if (fullscreenMedia.generationId && fullscreenMedia.videoId !== undefined) {
                    const videoKey = `${fullscreenMedia.generationId}-${fullscreenMedia.videoId}`;
                    setIsPlaying((prev) => ({ ...prev, [videoKey]: true }));
                  }
                }}
                onPause={() => {
                  if (fullscreenMedia.generationId && fullscreenMedia.videoId !== undefined) {
                    const videoKey = `${fullscreenMedia.generationId}-${fullscreenMedia.videoId}`;
                    setIsPlaying((prev) => ({ ...prev, [videoKey]: false }));
                  }
                }}
                onEnded={() => {
                  if (fullscreenMedia.generationId && fullscreenMedia.videoId !== undefined) {
                    const videoKey = `${fullscreenMedia.generationId}-${fullscreenMedia.videoId}`;
                    setIsPlaying((prev) => ({ ...prev, [videoKey]: false }));
                  }
                }}
                loop
                playsInline
                controls={false}
              />

              {/* Play/Pause button overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={toggleFullscreenVideo}
              >
                {fullscreenMedia.generationId &&
                  fullscreenMedia.videoId !== undefined &&
                  !isPlaying[`${fullscreenMedia.generationId}-${fullscreenMedia.videoId}`] && (
                    <div className="bg-white bg-opacity-70 rounded-full p-4">
                      <Play size={48} className="text-black" />
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render enhanced prompt modal
  const renderEnhancedPromptModal = () => {
    if (!showEnhancedPrompt) return null;

    return (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
        onClick={() => setShowEnhancedPrompt(null)}
      >
        <div
          className="bg-[#101218] rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-3xl mb-8 text-white">enhanced prompt</h2>

          <div className="bg-[#333] bg-opacity-70 rounded-lg p-6 mb-8">
            <p className="text-white text-lg leading-relaxed">{showEnhancedPrompt}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(showEnhancedPrompt)
                  .then(() => console.log('Copied to clipboard'))
                  .catch((err) => console.error('Failed to copy: ', err));
              }}
              className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="opacity-70"
              >
                <path
                  d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xl">copy</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render initial UI (before any generation)
  if (!isGenerated) {
    // Show loading skeletons when transitioning or loading
    if (isTransitioning || (isLoading && loadingGeneration)) {
      return (
        <div className="flex flex-col items-center justify-center">
          {renderDebugPanel()}
          {renderLoadingPlaceholders()}
        </div>
      );
    }

    if (modelsEnabled) {
      return (
        <div className="flex flex-col min-h-screen">
          {renderDebugPanel()}

          <div className="flex-grow flex flex-col">
            <div className="flex-grow">
              {/* Show loading skeletons when transitioning or loading */}
              {isTransitioning || (isLoading && loadingGeneration)
                ? renderLoadingPlaceholders()
                : null}
            </div>

            {/* Show full-size model selection ONLY if no generations yet and not loading */}
            {!isLoading && !modelsEnabledAfterGenerations && generations.length === 0
              ? renderFullSizeModelSelection()
              : /* Otherwise always show compact model selection */
                renderModelSelection()}
          </div>

          {/* Debug button */}
          <button
            onClick={() => setDebugMode(true)}
            className="fixed bottom-20 right-4 bg-gray-800 p-2 rounded-full z-10"
            title="Show Debug Panel (Ctrl+Shift+D)"
          >
            <Bug size={20} className="text-white" />
          </button>

          {/* Fixed prompt input at bottom */}
          <div className="fixed bottom-0 left-0 right-0 bg-background p-4">
            <div className="max-w-6xl mx-auto">
              <div className="bg-input bg-opacity-50 rounded-full p-1 flex items-center overflow-hidden">
                <input
                  type="text"
                  className="flex-1 bg-transparent py-3 px-6 text-white placeholder-gray-400 focus:outline-none hover:bg-input-hover focus:bg-input-hover transition-colors rounded-full"
                  placeholder="what would you like to generate?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />

                <div className="flex items-center">
                  <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="bg-button text-black font-medium py-3 px-8 rounded-full hover:bg-button-hover hover:text-white transition-colors whitespace-nowrap ml-1 mr-4 min-w-[120px]"
                  >
                    {isLoading ? <AnimatedEllipsis /> : 'generate'}
                  </button>

                  {/* Update the toggle label from "models" to "models" to match the screenshot */}
                  <div className="flex items-center gap-3 px-4 whitespace-nowrap">
                    <span className="text-gray-400">models</span>
                    <div
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                        modelsEnabled ? 'bg-toggle-active' : 'bg-toggle-inactive'
                      }`}
                      onClick={() => handleModelsToggle(!modelsEnabled)}
                    >
                      <div
                        className={`bg-gray-800 w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                          modelsEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        {renderDebugPanel()}
        <div className="text-center mb-2">
          <Image
            src="/images/logo-white-alpha.png"
            alt="Human Prompt"
            width={700}
            height={124}
            className="h-auto"
          />
        </div>
        <p className="text-white text-xl mt-2 mb-6">the future of gen AI is here</p>

        <div className="w-full max-w-xl flex justify-center">
          <textarea
            className="w-[90%] h-72 bg-input bg-opacity-50 rounded-xl p-6 text-white placeholder-gray-400 focus:outline-none hover:bg-input-hover focus:bg-input-hover transition-colors resize-none"
            placeholder="what would you like to generate?"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-center mt-8 gap-4">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-button text-black font-medium py-3 px-16 rounded-full hover:bg-button-hover hover:text-white transition-colors whitespace-nowrap disabled:opacity-50 min-w-[120px]"
          >
            {isLoading ? <AnimatedEllipsis /> : 'generate'}
          </button>

          <div className="flex items-center gap-3">
            <span className="text-gray-400">models</span>
            <div
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                modelsEnabled ? 'bg-toggle-active' : 'bg-toggle-inactive'
              }`}
              onClick={() => handleModelsToggle(!modelsEnabled)}
            >
              <div
                className={`bg-gray-800 w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                  modelsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => setDebugMode(true)}
          className="fixed bottom-4 right-4 bg-gray-800 p-2 rounded-full z-10"
          title="Show Debug Panel (Ctrl+Shift+D)"
        >
          <Bug size={20} className="text-white" />
        </button>
      </div>
    );
  }

  // Render generated content (after generation)
  return (
    <div className="flex flex-col min-h-screen">
      {renderDebugPanel()}
      {renderFullscreenMedia()}
      {renderEnhancedPromptModal()}
      {renderVideoGenerationModal()}

      <div className="flex-grow flex flex-col pb-20" ref={contentRef}>
        <div className="flex-grow">
          {/* Render all completed generations first */}
          {generations.map((generation) => renderGeneration(generation))}

          {/* Show loading placeholders below completed generations */}
          {isLoading && loadingGeneration && renderLoadingPlaceholders()}
        </div>

        {/* Always show model selection at the bottom if models are enabled */}
        {modelsEnabled && renderModelSelection()}

        {/* Invisible element for scrolling to bottom */}
        <div ref={bottomRef} />
      </div>

      {/* Fixed prompt input at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-input bg-opacity-50 rounded-full p-1 flex items-center overflow-hidden">
            <input
              type="text"
              className="flex-1 bg-transparent py-3 px-6 text-white placeholder-gray-400 focus:outline-none hover:bg-input-hover focus:bg-input-hover transition-colors rounded-full"
              placeholder="what would you like to generate?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div className="flex items-center">
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="bg-button text-black font-medium py-3 px-8 rounded-full hover:bg-button-hover hover:text-white transition-colors whitespace-nowrap ml-1 mr-4 min-w-[120px]"
              >
                {isLoading ? <AnimatedEllipsis /> : 'generate'}
              </button>

              <div className="flex items-center gap-3 px-4 whitespace-nowrap">
                <span className="text-gray-400">models</span>
                <div
                  className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${
                    modelsEnabled ? 'bg-toggle-active' : 'bg-toggle-inactive'
                  }`}
                  onClick={() => handleModelsToggle(!modelsEnabled)}
                >
                  <div
                    className={`bg-gray-800 w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
                      modelsEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debug button */}
      <button
        onClick={() => setDebugMode(true)}
        className="fixed bottom-20 right-4 bg-gray-800 p-2 rounded-full z-10"
        title="Show Debug Panel (Ctrl+Shift+D)"
      >
        <Bug size={20} className="text-white" />
      </button>
    </div>
  );
}
