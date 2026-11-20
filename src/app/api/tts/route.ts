import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get('text') || searchParams.get('q') || '';
    if (!text.trim()) {
      return new NextResponse('Text is required', { status: 400 });
    }

    const cleanText = text.slice(0, 200).trim();
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

    const res = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
    });

    if (!res.ok) {
      return new NextResponse('Error fetching audio from TTS engine', { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err: any) {
    if (err?.digest?.includes('NEXT_') || err?.message?.includes('bail out')) {
      throw err;
    }
    console.error('TTS API error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
