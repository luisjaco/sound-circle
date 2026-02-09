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

        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

        const token = jwt.sign({}, privateKey, {
            algorithm: 'ES256',
            expiresIn: '1h', // Token valid for 1 hour
            issuer: teamId,
            header: {
                alg: 'ES256',
                kid: keyId
            }
        });

        return NextResponse.json({ token });
    } catch (error) {
        console.error('Error generating Apple Music token:', error);
        return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
    }
}
