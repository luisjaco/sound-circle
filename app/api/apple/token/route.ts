import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET() {
    try {
        const teamId = process.env.APPLE_TEAM_ID;
        const keyId = process.env.APPLE_KEY_ID;
        const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

        if (!teamId || !keyId || !privateKeyRaw) {
            return NextResponse.json({ error: 'Missing Apple Music configuration' }, { status: 500 });
        }

        // Handle both literal \n (escaped) and actual newlines
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        const token = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '180d', // Token valid for 6 months
            issuer: teamId,
            header: {
                alg: 'ES256',
                kid: keyId
            }
        });

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Error generating Apple Music token:', error);
        const err = error instanceof Error ? error : new Error(String(error));
        return NextResponse.json({
            error: 'Failed to generate token',
            message: err.message,
            // Check if key looks roughly valid (starts/ends correct) without exposing full key
            keyDebug: process.env.APPLE_PRIVATE_KEY
                ? `${process.env.APPLE_PRIVATE_KEY.substring(0, 30)}...`
                : 'MISSING'
        }, { status: 500 });
    }
}
