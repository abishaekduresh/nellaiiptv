<?php
// Variables available: $resetLink, $year
?>
<!DOCTYPE html>
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
                This link is valid for <strong style="color:#e2e8f0;">1 hour</strong>.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background-color:#0891b2;border-radius:8px;">
                    <a href="<?php echo htmlspecialchars($resetLink); ?>" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#64748b;">If the button doesn't work, copy and paste this link:</p>
              <p style="margin:0 0 28px;font-size:12px;word-break:break-all;">
                <a href="<?php echo htmlspecialchars($resetLink); ?>" style="color:#0891b2;"><?php echo htmlspecialchars($resetLink); ?></a>
              </p>
              <hr style="border:none;border-top:1px solid #334155;margin:0 0 24px;" />
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#0f172a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#475569;">&copy; <?php echo $year; ?> Nellai IPTV. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
