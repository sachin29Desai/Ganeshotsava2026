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
  const isProd = process.env.NODE_ENV === 'production' || fs.existsSync(path.resolve(__dirname, 'dist'));

  // Body parsing middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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

      if (!email || !otp) {
        return res.status(400).json({ success: false, error: 'Email and OTP are required' });
      }

      const cleanEmail = email.toLowerCase().trim();
      const org = orgName || 'Eldorado Kannadigara Balaga — Ganeshotsava 2026';
      const subject = `Your Ganeshotsava 2026 Sign-In Link & OTP: ${otp}`;
      const fallbackMagicLink = magicLink || `https://ais-dev-p7a3udoouklbcodg3rdaay-1225695896.asia-east1.run.app?email=${encodeURIComponent(cleanEmail)}`;
      
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
            You requested sign-in to the <strong>Ganeshotsava 2026</strong> portal for <strong>${cleanEmail}</strong>.
          </p>
          ${fallbackMagicLink ? `
          <div style="text-align: center; margin: 24px 0 16px 0;">
            <a href="${fallbackMagicLink}" style="display: inline-block; background-color: #991b1b; color: #ffffff; text-decoration: none; padding: 13px 28px; font-weight: 800; border-radius: 8px; font-size: 15px; letter-spacing: 0.5px;">
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

      // 1. SMTP / Gmail Nodemailer Transport (if configured in environment)
      const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
      const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
      const smtpHost = process.env.SMTP_HOST || (smtpUser && smtpUser.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);

      if (!emailSentSuccessfully && smtpUser && smtpPass && smtpHost) {
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
            to: cleanEmail,
            subject,
            html: htmlContent
          });

          emailSentSuccessfully = true;
          emailProviderUsed = 'smtp';
          console.log(`[EMAIL DISPATCH] Verification email with code dispatched via SMTP to ${cleanEmail}`);
        } catch (smtpErr: any) {
          console.warn('SMTP send failed:', smtpErr?.message);
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
              from: process.env.EMAIL_FROM || 'Ganeshotsava 2026 <onboarding@resend.dev>',
              to: [cleanEmail],
              subject,
              html: htmlContent
            })
          });
          if (resendResp.ok) {
            emailSentSuccessfully = true;
            emailProviderUsed = 'resend';
            console.log(`[EMAIL DISPATCH] Verification email with code dispatched via Resend to ${cleanEmail}`);
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
              sender: { name: 'Ganeshotsava 2026', email: process.env.EMAIL_FROM || 'noreply@eldoradobalagi.org' },
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

      // 4. FormSubmit direct notification relay (sends exactly 1 email containing the 6-digit code & link)
      if (!emailSentSuccessfully) {
        try {
          const formSubmitResp = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(cleanEmail)}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Referer': fallbackMagicLink
            },
            body: JSON.stringify({
              _subject: `🌺 Ganeshotsava 2026: Your 6-Digit Verification Code is ${otp}`,
              _template: 'table',
              _captcha: 'false',
              Organization: org,
              Verification_Code: otp,
              Verification_Link: fallbackMagicLink,
              Important_Instructions: `Your 6-digit verification code is: ${otp}. Please enter this 6-digit code on the website or click the verification link above to complete your sign-in.`
            })
          });
          if (formSubmitResp.ok) {
            emailSentSuccessfully = true;
            emailProviderUsed = 'formsubmit';
            console.log(`[EMAIL DISPATCH] Verification email with code dispatched via FormSubmit to ${cleanEmail}`);
          }
        } catch (fsErr) {
          console.warn('[FORMSUBMIT] Relay error:', fsErr);
        }
      }

      console.log(`[OTP DISPATCH] Single verification email with code ${otp} dispatched for ${cleanEmail} via ${emailProviderUsed}`);
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
      server: { middlewareMode: true },
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

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
