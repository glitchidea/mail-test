export async function onRequestPost(context) {
  console.log('🚀 === EMAIL API REQUEST START ===');
  
  // Dynamic CORS handling
  const origin = context.request.headers.get('Origin');
  console.log('📍 Request origin:', origin);
  
  const allowedOrigins = [
    'https://glitchidea.com',
    'https://sentmail.glitchidea.com'
  ];
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
  
  console.log('🔒 CORS headers:', corsHeaders);

  try {
    // Log environment variables (without sensitive data)
    console.log('🔧 Environment check:', {
      hasFromEmail: !!context.env.FROM_EMAIL,
      hasToEmail: !!context.env.TO_EMAIL,
      hasSmtpHost: !!context.env.SMTP_HOST,
      hasSmtpUsername: !!context.env.SMTP_USERNAME,
      hasSmtpPassword: !!context.env.SMTP_PASSWORD,
      smtpPort: context.env.SMTP_PORT,
      fromEmailValue: context.env.FROM_EMAIL,
      toEmailValue: context.env.TO_EMAIL,
      smtpHost: context.env.SMTP_HOST
    });
    
    // Parse request body
    console.log('📝 Parsing request body...');
    const { subject, message, senderEmail } = await context.request.json();
    console.log('📊 Received data:', { 
      subject: subject?.substring(0, 50), 
      messageLength: message?.length, 
      senderEmail 
    });

    // Validate required fields
    console.log('✅ Validating required fields...');
    if (!subject?.trim() || !message?.trim() || !senderEmail?.trim()) {
      console.log('❌ Validation failed: Missing required fields');
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
    console.log('✅ Validating email format...');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
      console.log('❌ Validation failed: Invalid email format:', senderEmail);
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
    
    console.log('✅ All validations passed');

    // SMTP over HTTP - SimpleMail kullanacağız (MailChannels alternatifi)
    console.log('📤 Sending email via SMTP...');
    
    // Email formatı hazırla
    const emailData = {
      to: context.env.TO_EMAIL,
      from: context.env.FROM_EMAIL,
      subject: `[Contact Form] ${subject}`,
      html: `
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
      `,
      replyTo: senderEmail,
      smtp: {
        host: context.env.SMTP_HOST,
        port: parseInt(context.env.SMTP_PORT),
        username: context.env.SMTP_USERNAME,
        password: context.env.SMTP_PASSWORD,
        secure: true
      }
    };

    console.log('📧 Email data prepared:', {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      replyTo: emailData.replyTo,
      smtpHost: emailData.smtp.host,
      smtpPort: emailData.smtp.port,
      smtpUser: emailData.smtp.username,
      hasPassword: !!emailData.smtp.password
    });
    
    // Gmail SMTP-over-HTTP bridge
    const response = await fetch('https://formsubmit.co/ajax/' + context.env.TO_EMAIL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: `Contact Form (${senderEmail})`,
        email: senderEmail,
        subject: `[Contact Form] ${subject}`,
        message: message,
        _subject: `[Contact Form] ${subject}`,
        _template: 'box',
        _autoresponse: 'Thank you for your message. We will get back to you soon!'
      }),
    });

    console.log('📡 SMTP API response status:', response.status);
    console.log('📡 SMTP API response headers:', [...response.headers.entries()]);
    
    const responseText = await response.text();
    console.log('📡 SMTP API response body:', responseText);

    if (response.ok) {
      console.log('🎉 Email sent successfully via SMTP');
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
      console.error('🚨 SMTP API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
        headers: [...response.headers.entries()]
      });
      throw new Error(`SMTP API Error: ${response.status} - ${responseText}`);
    }

  } catch (error) {
    console.error('🚨 === FATAL ERROR ===');
    console.error('🚨 Error name:', error.name);
    console.error('🚨 Error message:', error.message);
    console.error('🚨 Error stack:', error.stack);
    console.error('🚨 === END ERROR ===');
    
    return new Response(JSON.stringify({
      success: false,
      message: 'Email gönderilirken bir hata oluştu',
      debug: {
        error: error.message,
        name: error.name
      }
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
    'https://sentmail.glitchidea.com'
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