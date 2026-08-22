import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// ---------------------------------------------------------------------------
// Telegram Push Notification Dispatcher
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { botToken, chatId, message } = body;

    const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chat = chatId || process.env.TELEGRAM_CHAT_ID;

    if (!token || !chat) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bot Token dan Chat ID Telegram diperlukan. Silakan atur di menu Pengaturan.',
        },
        { status: 400 }
      );
    }

    const tgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chat,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { success: false, error: data.description || 'Gagal mengirim pesan Telegram' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notifikasi berhasil dikirim ke Telegram Anda!',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
