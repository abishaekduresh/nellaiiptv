import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'development';

interface TokenPayload {
    email: string;
    exp: number;
    backendToken: string | null;
}

// Verifies the signed token and returns the payload, or null if invalid/expired
function verifyResetToken(token: string): TokenPayload | null {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payload, signature] = parts;
    const secret = process.env.RESET_TOKEN_SECRET!;

    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const sigBuffer = Buffer.from(signature, 'base64url');
    const expectedBuffer = Buffer.from(expectedSig, 'base64url');

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    let data: TokenPayload;
    try {
        data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
        return null;
    }

    if (!data.exp || Date.now() > data.exp) return null;

    return data;
}

// Safely parse JSON — returns null if body is not valid JSON
async function safeJson(res: Response): Promise<any> {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

// Extract backend reset token from common response shapes
function extractBackendToken(data: any): string | null {
    return (
        data?.data?.token      ||
        data?.data?.reset_token ||
        data?.token            ||
        data?.reset_token      ||
        null
    );
}

// Re-trigger forgot-password on the backend to obtain a fresh token for the given email.
// Used when the original link was generated before we started capturing backendToken.
async function fetchFreshBackendToken(
    email: string,
    backendUrl: string,
    apiSecret: string
): Promise<{ token: string | null; rawData: any }> {
    try {
        const res = await fetch(`${backendUrl}/customers/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiSecret,
                'X-Client-Platform': 'web',
            },
            body: JSON.stringify({ email, return_token: true }),
        });

        const data = await safeJson(res);
        return { token: extractBackendToken(data), rawData: data };
    } catch {
        return { token: null, rawData: null };
    }
}

export async function POST(req: NextRequest) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ status: false, message: 'Token and new password are required.' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ status: false, message: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        const payload = verifyResetToken(token);

        if (!payload) {
            return NextResponse.json(
                { status: false, message: 'This reset link is invalid or has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        const backendUrl = process.env.API_URL!;
        const apiSecret = process.env.API_SECRET!;

        // Use the backend token embedded in the HMAC payload (captured at forgot-password time).
        // If null (old link), re-trigger forgot-password to get a fresh token right now.
        let backendToken = payload.backendToken;
        let freshFetchDebug: any = null;

        if (!backendToken) {
            const fresh = await fetchFreshBackendToken(payload.email, backendUrl, apiSecret);
            backendToken = fresh.token;
            freshFetchDebug = fresh.rawData;
        }

        const requestBody: Record<string, any> = {
            email: payload.email,
            password,
            password_confirmation: password,
        };

        if (backendToken) {
            requestBody.token = backendToken;
        }

        const backendRes = await fetch(`${backendUrl}/customers/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': apiSecret,
                'X-Client-Platform': 'web',
            },
            body: JSON.stringify(requestBody),
        });

        const backendData = await safeJson(backendRes);

        if (!backendData?.status) {
            const errMessage = backendData?.message || `Backend responded with HTTP ${backendRes.status}`;

            if (isDev) {
                return NextResponse.json({
                    status: false,
                    message: `[DEV] Backend error: ${errMessage}`,
                    debug: {
                        endpoint: `${backendUrl}/customers/reset-password`,
                        sentBody: requestBody,
                        backendStatus: backendRes.status,
                        backendData,
                        backendTokenSource: payload.backendToken ? 'from_link_payload' : 'fresh_fetch',
                        freshFetchDebug,
                    },
                }, { status: 400 });
            }

            return NextResponse.json({ status: false, message: errMessage }, { status: 400 });
        }

        if (isDev) {
            return NextResponse.json({
                status: true,
                message: '[DEV] Password updated successfully. You can now log in.',
                debug: { email: payload.email, backendData },
            });
        }

        return NextResponse.json({ status: true, message: 'Password updated successfully. You can now log in.' });
    } catch (error: any) {
        console.error('[reset-password] unexpected error:', error);

        if (isDev) {
            return NextResponse.json({
                status: false,
                message: `[DEV] Unexpected error: ${error?.message || error}`,
                debug: { stack: error?.stack },
            }, { status: 500 });
        }

        return NextResponse.json({ status: false, message: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
