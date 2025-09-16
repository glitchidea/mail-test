export async function onRequestPost(context) {
  // Dynamic CORS handling
  const origin = context.request.headers.get('Origin');
  const allowedOrigins = [
    'https://glitchidea.com',
    'https://sentmail.glitchidea.com',
    'https://75cbf276.mail-test-c8x.pages.dev'
  ];
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
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

    // Prepare email content for MailChannels
    const emailContent = {
      personalizations: [{
        to: [{ email: context.env.TO_EMAIL }],
        subject: `[Contact Form] ${subject}`
      }],
      from: { 
        email: context.env.FROM_EMAIL,
        name: "Contact Form"
      },
      reply_to: { email: senderEmail },
      content: [{
        type: 'text/html',
        value: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d5a40;">New Contact Form Message</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>From:</strong> ${senderEmail}</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 3px solid #2d5a40;">
              <h3>Message:</h3>
              <p style="line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <hr style="margin: 30px 0; border: none; height: 1px; background: #e0e0e0;">
            <p style="color: #666; font-size: 12px;">This message was sent from the contact form at glitchidea.com</p>
          </div>
        `
      }]
    };

    // Send email using MailChannels API
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailContent),
    });

    const responseText = await response.text();
    console.log('MailChannels Response:', response.status, responseText);

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
      console.error('MailChannels Error:', response.status, responseText);
      throw new Error(`MailChannels API Error: ${response.status} - ${responseText}`);
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

export async function onRequestOptions(context) {
  // Dynamic CORS handling for preflight
  const origin = context.request.headers.get('Origin');
  const allowedOrigins = [
    'https://glitchidea.com',
    'https://sentmail.glitchidea.com', 
    'https://75cbf276.mail-test-c8x.pages.dev'
  ];
  
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}