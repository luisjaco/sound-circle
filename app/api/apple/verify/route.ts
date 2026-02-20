import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
  try {

    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

    if (!teamId || !keyId || !privateKeyRaw) {
      return NextResponse.json({
        success: false,
        error: "Missing environment variables",
        envCheck: {
          hasTeamId: !!teamId,
          hasKeyId: !!keyId,
          hasPrivateKey: !!privateKeyRaw
        }
      }, { status: 500 });
    }

    // Handle both literal \n (escaped) and actual newlines
    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      issuer: teamId,
      header: {
        alg: 'ES256',
        kid: keyId
      }
    });

    const verificationUrl = 'https://api.music.apple.com/v1/storefronts/us';

    const response = await fetch(verificationUrl, {
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
//curl http://localhost:3000/api/apple/verify <-- run this command to verify keys