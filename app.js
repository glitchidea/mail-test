const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:7590'],
    credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// SMTP Transporter oluştur
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Email içeriği oluştur
const createEmailContent = (subject, message, senderEmail) => {
    const currentDate = new Date().toLocaleString('tr-TR');
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
                            <h3 class="sender-name">${senderEmail.split('@')[0]}</h3>
                            <a href="mailto:${senderEmail}?subject=Re: ${subject}" class="sender-email">${senderEmail}</a>
                        </div>
                        <div class="message-date">${currentDate}</div>
                    </div>
                    <div class="message-subject">${subject}</div>
                    <div class="message-body">${message.replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            <div class="footer">
                <a href="mailto:${senderEmail}?subject=Re: ${subject}&body=%0A%0A%0A─────────────────────────────────────────────────────────────%0A📧%20YANIT%20VERİLEN%20MESAJ%0A─────────────────────────────────────────────────────────────%0A%0AGönderen:%20${senderEmail}%0ATarih:%20${currentDate}%0AKonu:%20${subject}%0A%0AMesaj:%0A${message.replace(/\n/g, '%0A')}%0A%0A─────────────────────────────────────────────────────────────%0A%0A" class="reply-button">📧 Hızlı Yanıt Gönder</a>
                <div class="divider"></div>
                <p class="footer-text">Bu mesaj ${process.env.FROM_EMAIL} adresinden gönderilmiştir.<br>Gönderim Tarihi: ${currentDate}</p>
            </div>
        </div>
    </body>
    </html>`;

    const textContent = `
Konu: ${subject}
Gönderen: ${senderEmail}

Mesaj:
${message}

---
Bu mesaj ${process.env.FROM_EMAIL} adresinden gönderilmiştir.
Gönderim Tarihi: ${currentDate}

💡 Hızlı Yanıt: ${senderEmail} adresine "Re: ${subject}" konusuyla yanıt verebilirsiniz.
    `;

    return { htmlContent, textContent };
};

// Ana sayfa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Email gönderme endpoint'i
app.post('/send-email', async (req, res) => {
    try {
        const { subject, message, senderEmail } = req.body;

        if (!subject || !message || !senderEmail) {
            return res.status(400).json({ success: false, message: 'Tüm alanlar doldurulmalıdır' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(senderEmail)) {
            return res.status(400).json({ success: false, message: 'Geçerli bir email adresi giriniz' });
        }

        const formattedSubject = `${subject} - gönderen(${senderEmail})`;
        const { htmlContent, textContent } = createEmailContent(subject, message, senderEmail);

        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.FROM_EMAIL,
            to: process.env.TO_EMAIL,
            subject: formattedSubject,
            text: textContent,
            html: htmlContent,
            replyTo: process.env.FROM_EMAIL
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email gönderildi:', info.messageId);

        res.json({ success: true, message: 'Mesajınız başarıyla gönderildi!', timestamp: new Date().toISOString() });
    } catch (error) {
        console.error('Email gönderme hatası:', error);
        res.status(500).json({ success: false, message: `Email gönderme hatası: ${error.message}` });
    }
});

// Server durumu endpoint'i
app.get('/status', (req, res) => {
    res.json({ status: 'OK', message: 'Email Sender Backend çalışıyor' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint bulunamadı' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
});

module.exports = app;

