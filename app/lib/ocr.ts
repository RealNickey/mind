// Dynamically import tesseract.js to avoid issues if it's missing or running on server improperly
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const Tesseract = await import('tesseract.js');
    
    // Tesseract.recognize handles both URLs and Buffers
    const result = await Tesseract.recognize(
      imageUrl,
      'eng',
      { logger: m => console.log(m) }
    );
    
    return result.data.text;
  } catch (error) {
    console.error('OCR Extraction Error:', error);
    return 'Could not extract text from image.';
  }
}
