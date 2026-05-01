'use server'
import jwt from 'jsonwebtoken';

export async function getClientToken() {
    try {
        const teamId = process.env.APPLE_TEAM_ID;
        const keyId = process.env.APPLE_KEY_ID;
        const privateKeyRaw = process.env.APPLE_PRIVATE_KEY;

        if (!teamId || !keyId || !privateKeyRaw) {
            console.error(`Missing Apple Music Configuration`);
            return false;
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

        return token;
    } catch (error) {
        console.error('Error generating Apple Music token:', error);
        const err = error instanceof Error ? error : new Error(String(error));
        const keyDebug = process.env.APPLE_PRIVATE_KEY ? `${process.env.APPLE_PRIVATE_KEY.substring(0, 30)}...` : 'MISSING'
        console.log(`Failed to generate token... debug: ${keyDebug}`)
        console.log(err.message)
        return;
    }
}