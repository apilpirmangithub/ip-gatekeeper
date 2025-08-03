import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    
    if (!image) {
      return NextResponse.json(
        { message: 'Image base64 is required' },
        { status: 400 }
      );
    }

    const params = new URLSearchParams();
    params.append('api_user', process.env.SIGHTENGINE_API_USER!);
    params.append('api_secret', process.env.SIGHTENGINE_API_SECRET!);
    params.append('media', `data:image/jpeg;base64,${image}`);
    // Perbaikan: Ganti model yang tidak ada dengan model yang tersedia
    params.append('models', 'genai'); // atau 'properties' untuk deteksi umum

    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    console.log('Sightengine response:', data); // untuk debugging
    
    // Perbaikan: Sesuaikan dengan struktur response model 'genai'
    const genaiData = data.genai;
    const isAI = genaiData?.prediction === 'ai' ?? false;
    const confidence = genaiData?.score ?? 0;

    return NextResponse.json({ isAI, confidence });
  } catch (error) {
    console.error('Sightengine API error:', error);
    return NextResponse.json(
      { message: 'AI detection failed' },
      { status: 500 }
    );
  }
}
