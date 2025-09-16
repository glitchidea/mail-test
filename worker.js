// Email sending worker for Cloudflare Workers

// CORS headers setup
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://glitchidea.com',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle OPTIONS request for CORS
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

// Send email using Cloudflare Email Workers
async function sendEmail(data) {
  const { subject, message, senderEmail } = data;
  
  // Get recipient email from environment variable
  const RECIPIENT_EMAIL = env.RECIPIENT_EMAIL;
  const SENDER_EMAIL = env.SENDER_EMAIL;
  
  try {
    const send_request = new Request('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: RECIPIENT_EMAIL }],
            from: {
              email: SENDER_EMAIL,
              name: 'Contact Form'
            },
            reply_to: {
              email: senderEmail
            }
          },
        ],
        subject: subject,
        content: [
          {
            type: 'text/plain',
            value: `Message from: ${senderEmail}\n\n${message}`
          },
        ],
      }),
    });

    const response = await fetch(send_request);
    
    if (response.status === 202) {
      return { success: true, message: 'Email sent successfully' };
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Main request handler
async function handleRequest(request, env) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // Serve static frontend
  if (request.method === 'GET') {
    const html = await fetch('https://raw.githubusercontent.com/yourusername/mail-test/main/public/index.html');
    return new Response(await html.text(), {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
        ...corsHeaders
      },
    });
  }

  // Handle API requests
  if (request.method === 'POST') {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Content-Type must be application/json' 
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
          ...corsHeaders
        }
      });
    }

    try {
      const data = await request.json();
      const { subject, message, senderEmail } = data;

      // Validate required fields
      if (!subject || !message || !senderEmail) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Missing required fields' 
        }), {
          status: 400,
          headers: {
            'content-type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Validate email format
      if (!isValidEmail(senderEmail)) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Invalid email format' 
        }), {
          status: 400,
          headers: {
            'content-type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const result = await sendEmail(data);
      
      return new Response(JSON.stringify(result), {
        headers: {
          'content-type': 'application/json',
          ...corsHeaders
        },
        status: result.success ? 200 : 500
      });
    } catch (error) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Invalid request body' 
      }), {
        status: 400,
        headers: {
          'content-type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

// Export the handler
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
