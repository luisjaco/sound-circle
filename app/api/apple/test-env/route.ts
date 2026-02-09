import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {
    //@TODO change from env file to Vercel production (To future Risham)
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKey = process.env.APPLE_PRIVATE_KEY;

    if (!teamId || !keyId || !privateKey) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        envCheck: {
          hasTeamId: !!teamId,
          hasKeyId: !!keyId,
          hasPrivateKey: !!privateKey
        }
      }, { status: 500 });
    }
    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '1h',
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId
      }
    });

    const testUrl = 'https://api.music.apple.com/v1/storefronts/us';

    const response = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: "Token generated but request to Apple Music API failed",
        status: response.status,
        error: data
      }, { status: response.status });
    }

    return NextResponse.json({
      success: true,
      message: "Apple Music API keys are valid and authentication was successful.",
      teamId,
      keyId,
      apiResponseInfo: "Successfully fetched US storefront data"
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      detail: "An error occurred while generating the token or making the request.",
      stack: error.stack
    }, { status: 500 });
  }
}
//curl http://localhost:3000/api/apple/test-env <-- run this command to test