import nodemailer from 'nodemailer';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8081;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '..')));

// Email HTML template
const createEmailContent = (name, email, message) => {
    const currentDate = new Date().toLocaleString('tr-TR');
    const subject = message.split('\n')[0].substring(0, 50);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
            .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 300; }
            .content { padding: 30px; }
            .message-card { background: #f8f9fa; border-radius: 10px; padding: 25px; margin: 20px 0; border-left: 5px solid #667eea; }
            .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e9ecef; }
            .sender-info { flex: 1; }
            .sender-name { font-size: 18px; font-weight: 600; color: #333; margin: 0; }
            .sender-email { color: #667eea; text-decoration: none; font-size: 14px; margin: 5px 0 0 0; }
            .message-date { color: #6c757d; font-size: 14px; text-align: right; }
            .message-subject { font-size: 20px; font-weight: 600; color: #333; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e9ecef; }
            .message-body { background: white; padding: 20px; border-radius: 8px; font-size: 16px; line-height: 1.7; color: #444; }
            .footer { background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef; }
            .reply-button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); transition: all 0.3s ease; margin: 10px 0; }
            .reply-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
            .footer-text { color: #6c757d; font-size: 14px; margin: 15px 0 0 0; }
            .divider { height: 1px; background: linear-gradient(90deg, transparent, #e9ecef, transparent); margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header"><h1>📧 Yeni Mesaj Aldınız</h1></div>
            <div class="content">
                <div class="message-card">
                    <div class="message-header">
                        <div class="sender-info">
                            <h3 class="sender-name">${name}</h3>
                            <a href="mailto:${email}?subject=Re: ${subject}" class="sender-email">${email}</a>
                        </div>
                        <div class="message-date">${currentDate}</div>
                    </div>
                    <div class="message-subject">${subject}</div>
                    <div class="message-body">${message.replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            <div class="footer">
                <a href="mailto:${email}?subject=Re: ${subject}&body=%0A%0A%0A─────────────────────────────────────────────────────────────%0A%0AGönderen:%20${email}%0ATarih:%20${currentDate}%0AKonu:%20${subject}%0A%0AMesaj:%0A${message.replace(/\n/g, '%0A')}%0A%0A─────────────────────────────────────────────────────────────%0A%0A" class="reply-button">📧 Hızlı Yanıt Gönder</a>
                <div class="divider"></div>
                <p class="footer-text">Bu mesaj glitchidea65@gmail.com adresinden gönderilmiştir.<br>Gönderim Tarihi: ${currentDate}</p>
            </div>
        </div>
    </body>
    </html>`;

    const textContent = `
📧 Yeni Mesaj Aldınız
${name}
${email}
${currentDate}
${subject}

${message}

---
Bu mesaj glitchidea65@gmail.com adresinden gönderilmiştir.
Gönderim Tarihi: ${currentDate}

💡 Hızlı Yanıt: ${email} adresine "Re: ${subject}" konusuyla yanıt verebilirsiniz.
    `;

    return { htmlContent, textContent };
};

// Email endpoint
app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;

    // Form validation
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Tüm alanlar doldurulmalıdır.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER 
                pass: process.env.GMAIL_PASS 
            }
        });

        const { htmlContent, textContent } = createEmailContent(name, email, message);

        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: 'info@glitchidea.com',
            replyTo: email,
            subject: `${message.split('\n')[0].substring(0, 50)} - gönderen(${email})`,
            html: htmlContent,
            text: textContent
        });

        res.status(200).json({ message: 'Mesajınız başarıyla gönderildi.' });
    } catch (error) {
        console.error('Email gönderme hatası:', error);
        res.status(500).json({ error: 'Mesaj gönderilirken bir hata oluştu.' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});