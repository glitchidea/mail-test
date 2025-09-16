import { SMTPClient } from 'emailjs';

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  try {
    // Parse request body
    const { subject, message, senderEmail } = await context.request.json();

    // Validate required fields
    if (!subject?.trim() || !message?.trim() || !senderEmail?.trim()) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Tüm alanları doldurunuz'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Geçersiz email formatı'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Initialize SMTP client
    const client = new SMTPClient({
      host: context.env.SMTP_HOST,
      port: parseInt(context.env.SMTP_PORT),
      user: context.env.SMTP_USER,
      password: context.env.SMTP_PASS,
      ssl: true,
    });

    // Send email
    await client.send({
      from: context.env.SMTP_USER,
      to: context.env.SMTP_USER,
      subject: `[Contact Form] ${subject}`,
      text: `From: ${senderEmail}\n\n${message}`,
      html: `
        <h3>Contact Form Message</h3>
        <p><strong>From:</strong> ${senderEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Email başarıyla gönderildi'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Email gönderilirken bir hata oluştu'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}
