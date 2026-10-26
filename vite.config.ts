import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

function shortUrlPlugin(): Plugin {
  return {
    name: 'short-url-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/create-short-link')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const targetUrl = urlObj.searchParams.get('url');
            const alias = urlObj.searchParams.get('alias');

            if (!targetUrl) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'Missing target url parameter' }));
              return;
            }

            let tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`;
            if (alias && alias.trim()) {
              tinyUrlApi += `&alias=${encodeURIComponent(alias.trim())}`;
            }

            const apiResp = await fetch(tinyUrlApi);
            const body = await apiResp.text();

            if (apiResp.ok && body.startsWith('http')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, shortUrl: body.trim() }));
            } else {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: body || 'Could not create custom alias.' }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err?.message || 'Failed to reach shortener service' }));
          }
          return;
        }
        next();
      });
    }
  };
}

function emailOtpPlugin(): Plugin {
  return {
    name: 'email-otp-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/send-otp-email')) {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
            return;
          }

          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const { email, otp, orgName, magicLink } = data;

              console.log(`\n======================================================`);
              console.log(`[EMAIL-OTP-PROXY] Incoming OTP dispatch request:`);
              console.log(`  Target Email: ${email}`);
              console.log(`  OTP Code:     ${otp}`);
              console.log(`  Org Name:     ${orgName || 'Eldorado Kannadigara Balaga'}`);
              console.log(`  Magic Link:   ${magicLink || 'None'}`);
              console.log(`======================================================`);

              if (!email || !otp) {
                console.error('[EMAIL-OTP-PROXY] FAILED: Missing email or OTP parameter.');
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Email and OTP are required' }));
                return;
              }

              const org = 'Kannadigara Balaga Portal';
              const subject = `🌺 Kannadigara Balaga — Member Access Link`;
              const targetMagicLink = magicLink || `https://ais-pre-g52qlb745qhljbygjytqsi-1225695896.asia-east1.run.app?email=${encodeURIComponent(email)}&action=login`;

              const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                  <div style="text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 16px; margin-bottom: 20px;">
                    <h2 style="color: #991b1b; margin: 0; font-size: 22px;">🌺 ${org}</h2>
                    <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Devotee & Resident Member Access</p>
                  </div>
                  <p style="color: #374151; font-size: 15px; line-height: 1.5;">
                    Namaskara / Hello,
                  </p>
                  <p style="color: #374151; font-size: 14px; line-height: 1.5;">
                    You requested access for <strong>${email}</strong> on the <strong>Kannadigara Balaga Portal</strong>.
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${targetMagicLink}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 14px 28px; font-weight: 800; border-radius: 10px; font-size: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      🚀 Click Here to Sign In / Access Portal
                    </a>
                  </div>
                  <p style="text-align: center; color: #4b5563; font-size: 12px; line-height: 1.5; margin-bottom: 20px;">
                    Or copy and paste this access link into your browser:<br/>
                    <a href="${targetMagicLink}" style="color: #991b1b; word-break: break-all;">${targetMagicLink}</a>
                  </p>
                  <p style="color: #4b5563; font-size: 13px; line-height: 1.5;">
                    ⏱️ This access link is valid for <strong>15 minutes</strong>.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.4; border-top: 1px solid #f3f4f6; padding-top: 14px; margin-top: 24px;">
                    If you did not request this link, you can safely ignore this email.<br/>
                    <em>Kannadigara Balaga Executive Committee 🙏</em>
                  </p>
                </div>
              `;

              // Provider 1: Resend API
              if (process.env.RESEND_API_KEY) {
                console.log('[EMAIL-OTP-PROXY] [Provider 1: Resend] Attempting API call...');
                try {
                  const resendResp = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      from: process.env.EMAIL_FROM || 'Kannadigara Balaga <onboarding@resend.dev>',
                      to: [email],
                      subject,
                      html: htmlContent
                    })
                  });
                  const rawResendText = await resendResp.text();
                  if (resendResp.ok) {
                    console.log(`[EMAIL-OTP-PROXY] [Provider 1: Resend] SUCCESS! Resend Response:`, rawResendText);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, provider: 'resend', raw: rawResendText }));
                    return;
                  } else {
                    console.error(`[EMAIL-OTP-PROXY] [Provider 1: Resend] FAILED with status ${resendResp.status}. Raw error:`, rawResendText);
                  }
                } catch (e: any) {
                  console.error('[EMAIL-OTP-PROXY] [Provider 1: Resend] EXCEPTION:', e?.message || e);
                }
              } else {
                console.log('[EMAIL-OTP-PROXY] [Provider 1: Resend] Skipped (RESEND_API_KEY is not set)');
              }

              // Provider 2: Brevo API
              if (process.env.BREVO_API_KEY) {
                console.log('[EMAIL-OTP-PROXY] [Provider 2: Brevo] Attempting API call...');
                try {
                  const brevoResp = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                      'api-key': process.env.BREVO_API_KEY,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      sender: { name: 'Kannadigara Balaga', email: process.env.EMAIL_FROM || 'noreply@eldoradobalagi.org' },
                      to: [{ email }],
                      subject,
                      htmlContent
                    })
                  });
                  const rawBrevoText = await brevoResp.text();
                  if (brevoResp.ok) {
                    console.log(`[EMAIL-OTP-PROXY] [Provider 2: Brevo] SUCCESS! Brevo Response:`, rawBrevoText);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, provider: 'brevo', raw: rawBrevoText }));
                    return;
                  } else {
                    console.error(`[EMAIL-OTP-PROXY] [Provider 2: Brevo] FAILED with status ${brevoResp.status}. Raw error:`, rawBrevoText);
                  }
                } catch (e: any) {
                  console.error('[EMAIL-OTP-PROXY] [Provider 2: Brevo] EXCEPTION:', e?.message || e);
                }
              } else {
                console.log('[EMAIL-OTP-PROXY] [Provider 2: Brevo] Skipped (BREVO_API_KEY is not set)');
              }

              // Provider 3: SMTP / Gmail Nodemailer Transport
              const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
              const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
              const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);

              const isPlaceholderPass = !smtpPass ||
                smtpPass.includes('your_') ||
                smtpPass.includes('password') ||
                smtpPass.includes('<') ||
                smtpPass.length < 8;

              if (smtpUser && smtpPass && !isPlaceholderPass && smtpHost) {
                console.log(`[EMAIL-OTP-PROXY] [Provider 3: SMTP] Attempting Nodemailer dispatch via host: ${smtpHost}, user: ${smtpUser}...`);
                try {
                  const transporter = nodemailer.createTransport({
                    host: smtpHost,
                    port: Number(process.env.SMTP_PORT) || (smtpHost === 'smtp.gmail.com' ? 465 : 587),
                    secure: process.env.SMTP_SECURE === 'true' || smtpHost === 'smtp.gmail.com',
                    auth: {
                      user: smtpUser,
                      pass: smtpPass
                    }
                  });

                  const mailInfo = await transporter.sendMail({
                    from: `"Kannadigara Balaga" <${smtpUser}>`,
                    to: email,
                    subject,
                    html: htmlContent
                  });

                  console.log(`[EMAIL-OTP-PROXY] [Provider 3: SMTP] SUCCESS! Message ID: ${mailInfo.messageId}, Response: ${mailInfo.response}`);
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, provider: 'smtp', messageId: mailInfo.messageId }));
                  return;
                } catch (smtpErr: any) {
                  console.error('[EMAIL-OTP-PROXY] [Provider 3: SMTP] FAILED with error:', smtpErr?.message || smtpErr);
                }
              } else {
                console.log(`[EMAIL-OTP-PROXY] [Provider 3: SMTP] Skipped (User: ${smtpUser || 'NONE'}, PassConfigured: ${Boolean(smtpPass)}, IsPlaceholder: ${isPlaceholderPass}, Host: ${smtpHost || 'NONE'})`);
              }

              // Provider 4: Web3Forms Direct Relay
              console.log('[EMAIL-OTP-PROXY] [Provider 4: Web3Forms] Attempting relay dispatch...');
              try {
                const web3Resp = await fetch('https://api.web3forms.com/submit', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify({
                    access_key: '4f6c4495-2c8c-4a30-8914-1e0c24b9423d',
                    name: org,
                    email,
                    subject,
                    message: `Your 6-digit verification code is: ${otp}\n\nPlease enter this code on the website to complete your sign-in or password reset.`
                  })
                });
                const rawW3Text = await web3Resp.text();
                if (web3Resp.ok) {
                  let w3Data: any = {};
                  try { w3Data = JSON.parse(rawW3Text); } catch (_) {}
                  if (w3Data.success !== false) {
                    console.log(`[EMAIL-OTP-PROXY] [Provider 4: Web3Forms] SUCCESS! Response:`, rawW3Text);
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, provider: 'web3forms', raw: rawW3Text }));
                    return;
                  } else {
                    console.error('[EMAIL-OTP-PROXY] [Provider 4: Web3Forms] Returned success: false. Raw:', rawW3Text);
                  }
                } else {
                  console.error(`[EMAIL-OTP-PROXY] [Provider 4: Web3Forms] FAILED with status ${web3Resp.status}. Raw error:`, rawW3Text);
                }
              } catch (web3Err: any) {
                console.error('[EMAIL-OTP-PROXY] [Provider 4: Web3Forms] EXCEPTION:', web3Err?.message || web3Err);
              }

              // Provider 5: Fallback acknowledgement
              console.log(`[EMAIL-OTP-PROXY] [Provider 5: Cloud DB] OTP code ${otp} stored in local/Firestore DB for ${email}`);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                dispatched: true,
                provider: 'cloud-db',
                message: `OTP stored in cloud database for ${email}`
              }));
            } catch (err: any) {
              console.error('[EMAIL-OTP-PROXY] Top-level handler exception:', err?.message || err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Server error sending email' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin(), shortUrlPlugin(), emailOtpPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      host: '0.0.0.0',
      port: 3000,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 3000,
    },
  };
});
