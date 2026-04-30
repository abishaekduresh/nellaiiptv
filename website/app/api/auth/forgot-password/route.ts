import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const isDev = process.env.NEXT_PUBLIC_APP_ENV === 'development';

// Creates a signed token that embeds email, expiry, and the backend's own reset token.
// Format: base64url(payload).HMAC-SHA256-signature
function createResetToken(email: string, backendToken: string | null): string {
    const exp = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    const payload = Buffer.from(JSON.stringify({ email, exp, backendToken })).toString('base64url');
    const secret = process.env.RESET_TOKEN_SECRET!;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}

// Safely parse JSON from a fetch Response — returns null if body is not valid JSON
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
        data?.data?.token ||
        data?.data?.reset_token ||
        data?.token ||
        data?.reset_token ||
        null
    );
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

        if (!email || !email.includes('@')) {
            return NextResponse.json({ status: false, message: 'A valid email address is required.' }, { status: 400 });
        }

        const backendUrl = process.env.API_URL;
        const apiSecret = process.env.API_SECRET;

        // Call the backend forgot-password endpoint.
        // It confirms the user exists and generates a reset token stored in its DB.
        let userExists = false;
        let backendMessage = '';
        let backendToken: string | null = null;
        let backendRawData: any = null;

        try {
            const backendRes = await fetch(`${backendUrl}/customers/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-KEY': apiSecret || '',
                    'X-Client-Platform': 'web',
                },
                body: JSON.stringify({ email, return_token: true }),
            });

            backendRawData = await safeJson(backendRes);
            userExists = backendRawData?.status === true;
            backendMessage = backendRawData?.message || `HTTP ${backendRes.status}`;
            backendToken = extractBackendToken(backendRawData);
        } catch (backendErr: any) {
            backendMessage = backendErr?.message || 'Backend unreachable';
            console.error('[forgot-password] backend check failed:', backendErr);
        }

        if (userExists) {
            // Embed the backend token inside our HMAC payload so it travels
            // securely in the reset link and we can pass it back on reset.
            const token = createResetToken(email, backendToken);
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            const resetLink = `${appUrl}/reset-password?token=${token}`;
            const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';

            const { data: resendData, error: resendError } = await resend.emails.send({
                from: fromEmail,
                to: email,
                subject: 'Reset your password — Nellai IPTV',
                html: buildEmailHtml(resetLink),
            });

            if (resendError) {
                console.error('[forgot-password] Resend error:', resendError);

                if (isDev) {
                    return NextResponse.json({
                        status: false,
                        message: `[DEV] Resend error: ${resendError.message}`,
                        debug: { resendError, fromEmail, to: email },
                    }, { status: 500 });
                }

                return NextResponse.json({ status: false, message: 'Failed to send reset email. Please try again.' }, { status: 500 });
            }

            if (isDev) {
                return NextResponse.json({
                    status: true,
                    message: `[DEV] Reset email sent to ${email}. Link valid for 10 minutes.`,
                    debug: {
                        emailId: (resendData as any)?.id,
                        resetLink,
                        backendToken,
                        backendRawData,
                    },
                });
            }

            return NextResponse.json({ status: true, message: 'Password reset link has been sent to your email.' });
        }

        // User not found or inactive — return the specific backend error
        if (isDev) {
            return NextResponse.json({
                status: false,
                message: backendMessage || 'No account found with this email address.',
                debug: {
                    endpoint: `${backendUrl}/customers/forgot-password`,
                    backendMessage,
                    backendRawData,
                },
            }, { status: 400 });
        }

        return NextResponse.json({
            status: false,
            message: backendMessage || 'No account found with this email address.',
        }, { status: 400 });
    } catch (error: any) {
        console.error('[forgot-password] unexpected error:', error);

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

function buildEmailHtml(resetLink: string): string {
    const year = new Date().getFullYear();
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#1e293b;border-radius:12px;border:1px solid #334155;overflow:hidden;">
          <tr>
            <td style="background-color:#0891b2;padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">Nellai IPTV</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#f1f5f9;">Reset Your Password</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#94a3b8;line-height:1.6;">
                We received a request to reset the password for your account. Click the button below to set a new password.
                This link is valid for <strong style="color:#e2e8f0;">10 minutes</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#0891b2;border-radius:8px;">
                    <a href="${resetLink}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link:</p>
              <p style="margin:0 0 28px;font-size:12px;word-break:break-all;">
                <a href="${resetLink}" style="color:#0891b2;">${resetLink}</a>
              </p>
              <hr style="border:none;border-top:1px solid #334155;margin:0 0 24px;" />
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#0f172a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">&copy; ${year} Nellai IPTV. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
