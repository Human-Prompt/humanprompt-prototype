/**
 * Utility functions for downloading images and videos
 */

/**
 * Download an image from a URL
 * @param imageUrl - The URL of the image to download
 * @param index - The index of the image (for naming)
 */
export async function downloadImage(imageUrl: string, index: number): Promise<void> {
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
    throw new Error('Failed to download image. Please try again.');
  }
}

/**
 * Download a video from a URL
 * @param videoUrl - The URL of the video to download
 * @param generationId - The ID of the generation
 * @param videoIndex - The index of the video
 */
export async function downloadVideo(
  videoUrl: string,
  generationId: string,
  videoIndex: number
): Promise<void> {
  try {
    // Create a temporary link to fetch the video as a blob
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `generated-video-${generationId}-${videoIndex}.mp4`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
  } catch (error) {
    console.error('Error downloading video:', error);
    throw new Error('Failed to download video. Please try again.');
  }
}
