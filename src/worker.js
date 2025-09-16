import { SMTPClient } from 'emailjs';

// CORS headers for preflight requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Handle OPTIONS requests for CORS
function handleOptions(request) {
  return new Response(null, {
    headers: corsHeaders
  });
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Main worker function
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: corsHeaders
      });
    }

    try {
      // Parse request body
      const { subject, message, senderEmail } = await request.json();

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
      if (!isValidEmail(senderEmail)) {
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
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT),
        user: env.SMTP_USER,
        password: env.SMTP_PASS,
        ssl: true,
      });

      // Send email
      await client.send({
        from: env.SMTP_USER,
        to: env.SMTP_USER,
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
};
