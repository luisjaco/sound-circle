import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({
        success: false,
        error: "Missing one or more required environment variables",
        envCheck: {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret
        }
      }, { status: 500 });
    }
    const tokenUrl = 'https://accounts.spotify.com/api/token';
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: "Keys found but Spotify API request failed",
        status: response.status,
        error: data
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: "Spotify API keys are valid and authentication was successful.",
      clientId: clientId.substring(0, 5) + "...",
      tokenType: data.token_type,
      expiresIn: data.expires_in
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      detail: "An error occurred while testing the Spotify keys.",
    }, { status: 500 });
  }
}
