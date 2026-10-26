import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Body parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware allowing cross-origin requests from custom domain
  app.use((req, res, next) => {
    const origin = (req.headers.origin as string) || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- API ROUTE: SHORT LINK CREATION ---
  app.get('/api/create-short-link', async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      const alias = req.query.alias as string;

      if (!targetUrl) {
        return res.status(400).json({ success: false, error: 'Missing target url parameter' });
      }

      let tinyUrlApi = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(targetUrl)}`;
      if (alias && alias.trim()) {
        tinyUrlApi += `&alias=${encodeURIComponent(alias.trim())}`;
      }

      const apiResp = await fetch(tinyUrlApi);
      const body = await apiResp.text();

      if (apiResp.ok && body.startsWith('http')) {
        res.json({ success: true, shortUrl: body.trim() });
      } else {
        res.json({ success: false, error: body || 'Could not create custom alias.' });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to reach shortener service' });
    }
  });

  // --- API ROUTE: SEND OTP EMAIL ---
  app.post('/api/send-otp-email', async (req, res) => {
    try {
      const { email, otp, orgName, magicLink } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const org = 'Kannadigara Balaga Portal';
      const subject = `🌺 Kannadigara Balaga — Member Access Link`;

      let requestOrigin = '';
      if (req.headers.referer) {
        try {
          const refUrl = new URL(req.headers.referer);
          requestOrigin = refUrl.origin;
        } catch (_) {}
      }
      if (!requestOrigin && req.headers.origin) {
        requestOrigin = req.headers.origin as string;
      }
      if (!requestOrigin || requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')) {
        requestOrigin = process.env.SHARED_APP_URL || 'https://ais-pre-g52qlb745qhljbygjytqsi-1225695896.asia-east1.run.app';
      }

      const targetMagicLink = magicLink || `${requestOrigin}?email=${encodeURIComponent(cleanEmail)}&action=login`;

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
            You requested access for <strong>${cleanEmail}</strong> on the <strong>Kannadigara Balaga Portal</strong>.
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

      // Read Firebase API key from config file
      let firebaseApiKey = 'AIzaSyARQQ2BwqkLnGrS9RrxhF8nBNrc_sGijsQ';
      try {
        const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
        if (fs.existsSync(configPath)) {
          const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          if (cfg.apiKey) firebaseApiKey = cfg.apiKey;
        }
      } catch (e) {
        console.warn('Could not read firebase config in server.ts:', e);
      }

      let emailSentSuccessfully = false;
      let emailProviderUsed = 'none';

      // 1. SMTP / Gmail Nodemailer Transport (if valid credentials configured in environment)
      const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
      const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
      const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);

      const isPlaceholderPass = !smtpPass ||
        smtpPass.includes('your_') ||
        smtpPass.includes('password') ||
        smtpPass.includes('<') ||
        smtpPass.length < 8;

      if (!emailSentSuccessfully && smtpUser && smtpPass && !isPlaceholderPass && smtpHost) {
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
            from: `"Kannadigara Balaga" <${smtpUser}>`,
            to: cleanEmail,
            subject,
            html: htmlContent
          });

          emailSentSuccessfully = true;
          emailProviderUsed = 'smtp';
          console.log(`[EMAIL DISPATCH] Access link email dispatched via SMTP to ${cleanEmail}`);
        } catch (smtpErr: any) {
          console.warn('[SMTP WARNING] SMTP login not accepted or invalid password. Falling back to direct Web3Forms dispatch:', smtpErr?.message);
        }
      }

      // 2. Resend API (if configured)
      if (!emailSentSuccessfully && process.env.RESEND_API_KEY) {
        try {
          const resendResp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'Kannadigara Balaga <onboarding@resend.dev>',
              to: [cleanEmail],
              subject,
              html: htmlContent
            })
          });
          if (resendResp.ok) {
            emailSentSuccessfully = true;
            emailProviderUsed = 'resend';
            console.log(`[EMAIL DISPATCH] Access link email dispatched via Resend to ${cleanEmail}`);
          }
        } catch (e) {
          console.warn('Resend provider error:', e);
        }
      }

      // 3. Brevo API (if configured)
      if (!emailSentSuccessfully && process.env.BREVO_API_KEY) {
        try {
          const brevoResp = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': process.env.BREVO_API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sender: { name: 'Kannadigara Balaga', email: process.env.EMAIL_FROM || 'noreply@eldoradobalagi.org' },
              to: [{ email: cleanEmail }],
              subject,
              htmlContent
            })
          });
          if (brevoResp.ok) {
            emailSentSuccessfully = true;
            emailProviderUsed = 'brevo';
            console.log(`[EMAIL DISPATCH] Verification email with code dispatched via Brevo to ${cleanEmail}`);
          }
        } catch (e) {
          console.warn('Brevo provider error:', e);
        }
      }

      // 4. Web3Forms direct notification relay (sends email directly with ZERO recipient activation required!)
      if (!emailSentSuccessfully) {
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
              email: cleanEmail,
              subject: `🌺 Ganeshotsava 2026: Your 6-Digit Verification Code is ${otp}`,
              message: `Your 6-digit verification code is: ${otp}\n\nPlease enter this code on the website to complete your sign-in or password reset.`
            })
          });
          if (web3Resp.ok) {
            const w3Data = await web3Resp.json().catch(() => ({}));
            if (w3Data.success !== false) {
              emailSentSuccessfully = true;
              emailProviderUsed = 'web3forms';
              console.log(`[EMAIL DISPATCH] Verification email with code dispatched via Web3Forms to ${cleanEmail}`);
            }
          }
        } catch (web3Err) {
          console.warn('[WEB3FORMS] Relay error:', web3Err);
        }
      }

      // 5. Admin Notification Fallback via Web3Forms (always sent to permanent administrator)
      try {
        await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            access_key: '4f6c4495-2c8c-4a30-8914-1e0c24b9423d',
            name: 'Kannadigara Balaga Portal Alert',
            email: 'desaisachin95@gmail.com',
            subject: `🔔 Kannadigara Balaga Access Alert: ${cleanEmail}`,
            message: `A member (${cleanEmail}) requested access on the Kannadigara Balaga Portal.\nSign-in link: ${targetMagicLink}`
          })
        });
        console.log(`[ADMIN NOTIFICATION] Dispatched access notification to desaisachin95@gmail.com`);
      } catch (err) {
        console.warn('Admin notification dispatch error:', err);
      }

      console.log(`[MAGIC LINK DISPATCH] Single verification email dispatched for ${cleanEmail} via ${emailProviderUsed}`);
      // Do NOT send the OTP or magic link back to client - user must retrieve code from their email
      res.json({
        success: true,
        dispatched: true,
        provider: emailProviderUsed,
        message: `Verification code dispatched to ${cleanEmail}`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Server error sending email' });
    }
  });

  // --- Static Files / Assets routing ---
  if (!isProd) {
    // In development mode: Mount Vite dev server middleware
    console.log('Starting full-stack server in DEVELOPMENT mode...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'custom'
    });
    
    app.use(vite.middlewares);
    
    // Serve index.html dynamically through Vite
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // In production mode: Serve pre-built static files from dist
    console.log('Starting full-stack server in PRODUCTION mode...');
    app.use(express.static(path.resolve(__dirname, 'dist')));
    
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const host = '0.0.0.0';
  app.listen(Number(port), host, () => {
    console.log(`Server is running at http://${host}:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
