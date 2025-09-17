const nodemailer = require('nodemailer');
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8081;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/send-email', async (req, res) => {
    // Form verilerini al
    const { name, email, message } = req.body;
    
    // Basit doğrulama
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Tüm alanlar doldurulmalıdır.' });
    }
    
    // Email doğrulama
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        // Email içeriği
        const mailOptions = {
            from: `"${name}" <${email}>`,
            to: 'info@glitchidea.com',
            replyTo: email,
            subject: 'Yeni İletişim Formu Mesajı',
            html: `
                <h3>Yeni İletişim Formu Mesajı</h3>
                <p><strong>İsim:</strong> ${name}</p>
                <p><strong>E-posta:</strong> ${email}</p>
                <p><strong>Mesaj:</strong><br>${message}</p>
            `,
            text: `İsim: ${name}\nE-posta: ${email}\n\nMesaj:\n${message}`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Mesajınız başarıyla gönderildi.' });
    } catch (error) {
        console.error('Email gönderme hatası:', error);
        res.status(500).json({ error: 'Mesaj gönderilirken bir hata oluştu.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});