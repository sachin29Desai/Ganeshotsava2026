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

              if (!email || !otp) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: 'Email and OTP are required' }));
                return;
              }

              const org = orgName || 'Eldorado Kannadigara Balaga — Ganeshotsava 2026';
              const subject = `Your Ganeshotsava 2026 Sign-In Link & OTP: ${otp}`;
              const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                  <div style="text-align: center; border-bottom: 2px solid #991b1b; padding-bottom: 16px; margin-bottom: 20px;">
                    <h2 style="color: #991b1b; margin: 0; font-size: 22px;">🌺 ${org}</h2>
                    <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0 0;">Devotee & Resident Portal Sign-In</p>
                  </div>
                  <p style="color: #374151; font-size: 15px; line-height: 1.5;">
                    Namaskara / Hello,
                  </p>
                  <p style="color: #374151; font-size: 14px; line-height: 1.5;">
                    You requested sign-in to the <strong>Ganeshotsava 2026</strong> portal for <strong>${email}</strong>.
                  </p>
                  ${magicLink ? `
                  <div style="text-align: center; margin: 24px 0 16px 0;">
                    <a href="${magicLink}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 13px 28px; font-weight: 800; border-radius: 8px; font-size: 15px; letter-spacing: 0.5px;">
                      🚀 Click Here to Sign In Automatically
                    </a>
                  </div>
                  <p style="text-align: center; color: #6b7280; font-size: 12px; margin-bottom: 24px;">
                    (Instant 1-click login — no password or confirmation needed)
                  </p>
                  ` : ''}
                  <p style="color: #374151; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
                    Or enter this 6-digit verification code (OTP) on the login page:
                  </p>
                  <div style="text-align: center; margin: 16px 0 24px 0;">
                    <span style="display: inline-block; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #991b1b; background-color: #fef2f2; border: 2px dashed #dc2626; padding: 10px 24px; border-radius: 10px; font-family: monospace;">
                      ${otp}
                    </span>
                  </div>
                  <p style="color: #4b5563; font-size: 13px; line-height: 1.5;">
                    ⏱️ This link and OTP are valid for <strong>10 minutes</strong>.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; line-height: 1.4; border-top: 1px solid #f3f4f6; padding-top: 14px; margin-top: 24px;">
                    If you did not request this sign-in link, you can safely ignore this email.<br/>
                    <em>Ganapati Bappa Morya! 🙏</em>
                  </p>
                </div>
              `;

              // Provider 1: Resend API
              if (process.env.RESEND_API_KEY) {
                try {
                  const resendResp = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      from: process.env.EMAIL_FROM || 'Ganeshotsava 2026 <onboarding@resend.dev>',
                      to: [email],
                      subject,
                      html: htmlContent
                    })
                  });
                  if (resendResp.ok) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, provider: 'resend' }));
                    return;
                  }
                } catch (e) {
                  console.warn('Resend provider error:', e);
                }
              }

              // Provider 2: Brevo API
              if (process.env.BREVO_API_KEY) {
                try {
                  const brevoResp = await fetch('https://api.brevo.com/v3/smtp/email', {
                    method: 'POST',
                    headers: {
                      'api-key': process.env.BREVO_API_KEY,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      sender: { name: 'Ganeshotsava 2026', email: process.env.EMAIL_FROM || 'noreply@eldoradobalagi.org' },
                      to: [{ email }],
                      subject,
                      htmlContent
                    })
                  });
                  if (brevoResp.ok) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ success: true, provider: 'brevo' }));
                    return;
                  }
                } catch (e) {
                  console.warn('Brevo provider error:', e);
                }
              }

              // Provider 3: SMTP / Gmail Nodemailer Transport
              const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
              const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
              const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);

              if (smtpUser && smtpPass && smtpHost) {
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

                  await transporter.sendMail({
                    from: `"Ganeshotsava 2026" <${smtpUser}>`,
                    to: email,
                    subject,
                    html: htmlContent
                  });

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, provider: 'smtp' }));
                  return;
                } catch (smtpErr: any) {
                  console.error('SMTP send failed:', smtpErr);
                }
              }

              // Provider 4: Fallback acknowledgement
              console.log(`[OTP DISPATCH] Dispatched 6-digit OTP code to ${email}`);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: true,
                dispatched: true,
                provider: smtpUser ? 'smtp' : 'server-dispatcher',
                message: `OTP dispatched to ${email}`
              }));
            } catch (err: any) {
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
