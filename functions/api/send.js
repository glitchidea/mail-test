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

    // Prepare email content
    const emailContent = {
      personalizations: [{
        to: [{ email: context.env.SMTP_USER }],
        subject: `[Contact Form] ${subject}`
      }],
      from: { email: context.env.SMTP_USER },
      reply_to: { email: senderEmail },
      content: [{
        type: 'text/html',
        value: `
          <h3>Contact Form Message</h3>
          <p><strong>From:</strong> ${senderEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <hr>
          <p>${message.replace(/\n/g, '<br>')}</p>
        `
      }]
    };

    // Send email using Cloudflare Email
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    });

    if (response.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Email başarıyla gönderildi'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } else {
      throw new Error('Email sending failed');
    }

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

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}