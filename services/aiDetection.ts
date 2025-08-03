export async function detectAI(imageBuffer: Buffer): Promise<{ isAI: boolean; confidence: number }> {
  try {
    const imageBase64 = imageBuffer.toString('base64');
    const response = await fetch('/api/detect-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 }),
    });
    
    if (!response.ok) throw new Error('AI detection API failed');
    return await response.json();
  } catch (error) {
    console.error('detectAI error:', error);
    return { isAI: false, confidence: 0 };
  }
}
