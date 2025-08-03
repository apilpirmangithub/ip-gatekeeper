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
    params.append('models', 'genai');

    const response = await fetch('https://api.sightengine.com/1.0/check.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await response.json();
    console.log('Sightengine full response:', data);
    
    // Cek jika ada error dari API
    if (data.status === 'failure') {
      console.error('Sightengine API error:', data.error);
      return NextResponse.json(
        { message: `Sightengine error: ${data.error?.message}` },
        { status: 400 }
      );
    }
    
    // Sesuai dokumentasi: response ada di data.type.ai_generated
    const aiScore = data.type?.ai_generated;
    
    if (aiScore === undefined) {
      console.error('AI score not found in response:', data);
      return NextResponse.json(
        { message: 'AI score not found in response' },
        { status: 500 }
      );
    }
    
    const isAI = aiScore > 0.5; // threshold 50%
    const confidence = aiScore;

    console.log('AI Detection Result:', { isAI, confidence, aiScore });

    return NextResponse.json({ isAI, confidence });
  } catch (error) {
    console.error('Sightengine API error:', error);
    return NextResponse.json(
      { message: 'AI detection failed' },
      { status: 500 }
    );
  }
}
