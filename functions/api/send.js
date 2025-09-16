// Email sending function for Cloudflare Pages
export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://glitchidea.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const data = await context.request.json();
    const { subject, message, senderEmail } = data;

    // Validate required fields
    if (!subject || !message || !senderEmail) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Tüm alanlar doldurulmalıdır' 
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(senderEmail)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Geçerli bir email adresi giriniz' 
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const currentDate = new Date().toLocaleString('tr-TR');
    const formattedSubject = `${subject} - gönderen(${senderEmail})`;

    // Create email content
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f7fa; }
            .email-container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #2d5a40 0%, #1a472a 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 300; }
            .content { padding: 30px; }
            .message-card { background: #f8f9fa; border-radius: 10px; padding: 25px; margin: 20px 0; border-left: 5px solid #2d5a40; }
            .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e9ecef; }
            .sender-info { flex: 1; }
            .sender-name { font-size: 18px; font-weight: 600; color: #333; margin: 0; }
            .sender-email { color: #2d5a40; text-decoration: none; font-size: 14px; margin: 5px 0 0 0; }
            .message-date { color: #6c757d; font-size: 14px; text-align: right; }
            .message-subject { font-size: 20px; font-weight: 600; color: #333; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e9ecef; }
            .message-body { background: white; padding: 20px; border-radius: 8px; font-size: 16px; line-height: 1.7; color: #444; }
            .footer { background: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #e9ecef; }
            .reply-button { background: linear-gradient(135deg, #2d5a40 0%, #1a472a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(45, 90, 64, 0.3); transition: all 0.3s ease; margin: 10px 0; }
            .reply-button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(45, 90, 64, 0.4); }
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
                <p class="footer-text">Bu mesaj ${context.env.FROM_EMAIL} adresinden gönderilmiştir.<br>Gönderim Tarihi: ${currentDate}</p>
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
Bu mesaj ${context.env.FROM_EMAIL} adresinden gönderilmiştir.
Gönderim Tarihi: ${currentDate}

💡 Hızlı Yanıt: ${senderEmail} adresine "Re: ${subject}" konusuyla yanıt verebilirsiniz.
    `;

    // Gmail SMTP üzerinden email gönderme
    const smtpUrl = `smtps://${encodeURIComponent(context.env.SMTP_USERNAME)}:${encodeURIComponent(context.env.SMTP_PASSWORD)}@${context.env.SMTP_HOST}:${context.env.SMTP_PORT}`;
    
    const emailData = {
      from: context.env.FROM_EMAIL,
      to: context.env.TO_EMAIL,
      subject: formattedSubject,
      text: textContent,
      html: htmlContent,
      replyTo: senderEmail
    };

    const response = await fetch(smtpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Mesajınız başarıyla gönderildi!',
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'content-type': 'application/json',
          ...corsHeaders
        }
      });
    } else {
      throw new Error('Email gönderme hatası');
    }
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      message: `Email gönderme hatası: ${error.message}` 
    }), {
      status: 500,
      headers: {
        'content-type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://glitchidea.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}