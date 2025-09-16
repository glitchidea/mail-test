/**
 * Cloudflare Worker for Email API
 * Domain: sentmail.glitchidea.com
 * Main Site: glitchidea.com
 */

import { createTransport } from 'nodemailer';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://glitchidea.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Debug logging function
function debugLog(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    message,
    ...(data && { data })
  };
  console.log(`[${level.toUpperCase()}] ${timestamp}: ${message}`, data || '');
  return logEntry;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rate limiting (simple in-memory store for demo)
const rateLimitStore = new Map();

function checkRateLimit(ip, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip).filter(time => time > windowStart);
  
  if (requests.length >= maxRequests) {
    return false;
  }
  
  requests.push(now);
  rateLimitStore.set(ip, requests);
  return true;
}

// Create SMTP transporter
function createSMTPTransporter(env) {
  debugLog('info', 'Creating SMTP transporter');
  
  return createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT) || 587,
    secure: env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates if needed
    }
  });
}

// Send email function
async function sendEmail(transporter, emailData, env) {
  debugLog('info', 'Preparing to send email', {
    to: env.RECEIVER_EMAIL,
    subject: emailData.subject,
    from: emailData.senderEmail
  });

  const mailOptions = {
    from: `"${emailData.senderName || 'Contact Form'}" <${env.SMTP_USER}>`,
    to: env.RECEIVER_EMAIL,
    replyTo: emailData.senderEmail,
    subject: `[Contact Form] ${emailData.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a472a 0%, #2d5a40 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">💌 Yeni İletişim Formu Mesajı</h2>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2d5a40; margin-top: 0;">📧 Gönderen Bilgileri</h3>
            <p><strong>Email:</strong> ${emailData.senderEmail}</p>
            <p><strong>Konu:</strong> ${emailData.subject}</p>
            <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px;">
            <h3 style="color: #2d5a40; margin-top: 0;">💬 Mesaj İçeriği</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 3px solid #2d5a40;">
              ${emailData.message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Bu mesaj glitchidea.com iletişim formu üzerinden gönderilmiştir.</p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    debugLog('success', 'Email sent successfully', { messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    debugLog('error', 'Failed to send email', { error: error.message, stack: error.stack });
    throw error;
  }
}

// Main handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    debugLog('info', `${request.method} ${url.pathname}`, { ip: clientIP });

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }

    // Serve the contact form on root
    if (request.method === 'GET' && url.pathname === '/') {
      const html = await getContactFormHTML();
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders
        }
      });
    }

    // API endpoint for sending emails
    if (request.method === 'POST' && url.pathname === '/api/send') {
      try {
        // Rate limiting
        if (!checkRateLimit(clientIP)) {
          debugLog('warning', 'Rate limit exceeded', { ip: clientIP });
          return new Response(JSON.stringify({
            success: false,
            message: 'Çok fazla istek gönderildi. Lütfen bir süre bekleyin.',
            code: 'RATE_LIMIT_EXCEEDED'
          }), {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Parse request body
        const contentType = request.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Content-Type must be application/json',
            code: 'INVALID_CONTENT_TYPE'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        const data = await request.json();
        debugLog('info', 'Received email request', { 
          subject: data.subject, 
          senderEmail: data.senderEmail,
          messageLength: data.message?.length 
        });

        // Validate required fields
        if (!data.subject || !data.message || !data.senderEmail) {
          debugLog('error', 'Missing required fields', data);
          return new Response(JSON.stringify({
            success: false,
            message: 'Gerekli alanlar eksik: subject, message, senderEmail',
            code: 'MISSING_FIELDS'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Validate email format
        if (!isValidEmail(data.senderEmail)) {
          debugLog('error', 'Invalid email format', { email: data.senderEmail });
          return new Response(JSON.stringify({
            success: false,
            message: 'Geçersiz email formatı',
            code: 'INVALID_EMAIL'
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Check environment variables
        const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'RECEIVER_EMAIL'];
        const missingVars = requiredEnvVars.filter(varName => !env[varName]);
        
        if (missingVars.length > 0) {
          debugLog('error', 'Missing environment variables', { missing: missingVars });
          return new Response(JSON.stringify({
            success: false,
            message: 'Sunucu yapılandırma hatası',
            code: 'CONFIG_ERROR'
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Create transporter and send email
        const transporter = createSMTPTransporter(env);
        const result = await sendEmail(transporter, data, env);

        debugLog('success', 'Email API request completed', result);

        return new Response(JSON.stringify({
          success: true,
          message: 'Email başarıyla gönderildi',
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });

      } catch (error) {
        debugLog('error', 'API request failed', { 
          error: error.message, 
          stack: error.stack 
        });

        return new Response(JSON.stringify({
          success: false,
          message: 'Email gönderilirken bir hata oluştu',
          code: 'SEND_ERROR',
          ...(env.DEBUG === 'true' && { debug: error.message })
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }
    }

    // API documentation endpoint
    if (request.method === 'GET' && url.pathname === '/api/docs') {
      const docs = getAPIDocumentation();
      return new Response(docs, {
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders
        }
      });
    }

    // 404 for other routes
    return new Response(JSON.stringify({
      success: false,
      message: 'Endpoint bulunamadı',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
};

// Get contact form HTML
async function getContactFormHTML() {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email API - GlitchIdea</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1a472a 0%, #2d5a40 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 600px;
        }

        .email-form {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 15px;
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
            padding: 35px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
            font-weight: 300;
        }

        .subtitle {
            text-align: center;
            color: #555;
            margin-bottom: 25px;
            font-size: 1.05em;
            background: #f5f5f5;
            padding: 12px;
            border-radius: 8px;
            border-left: 3px solid #2d5a40;
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 500;
            font-size: 1.1em;
        }

        input[type="text"],
        input[type="email"],
        textarea {
            width: 100%;
            padding: 14px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            font-size: 15px;
            transition: all 0.3s ease;
            background: #fafafa;
        }

        input[type="text"]:focus,
        input[type="email"]:focus,
        textarea:focus {
            outline: none;
            border-color: #2d5a40;
            background: white;
            box-shadow: 0 0 0 3px rgba(45, 90, 64, 0.1);
        }

        textarea {
            resize: vertical;
            min-height: 120px;
            font-family: inherit;
        }

        button {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #2d5a40 0%, #1a472a 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 17px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            letter-spacing: 0.5px;
        }

        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(45, 90, 64, 0.3);
            background: linear-gradient(135deg, #346b4a 0%, #1f5632 100%);
        }

        button:active {
            transform: translateY(0);
        }

        button:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }

        .status-message {
            margin-top: 20px;
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            font-weight: 500;
            display: none;
        }

        .status-message.success {
            background: #e8f5e9;
            color: #2d5a40;
            border: 1px solid #a5d6b7;
            display: block;
        }

        .status-message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
            display: block;
        }

        .api-info {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 3px solid #2d5a40;
        }

        .api-info h3 {
            color: #2d5a40;
            margin-bottom: 10px;
        }

        .api-info code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="email-form">
            <h1>📧 Email API</h1>
            <p class="subtitle">Test the email sending functionality</p>
            
            <form id="emailForm">
                <div class="form-group">
                    <label for="subject">Konu:</label>
                    <input type="text" id="subject" name="subject" required>
                </div>
                
                <div class="form-group">
                    <label for="message">Mesaj:</label>
                    <textarea id="message" name="message" rows="8" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="senderEmail">Gönderen Email:</label>
                    <input type="email" id="senderEmail" name="senderEmail" placeholder="ornek@email.com" required>
                </div>
                
                <button type="submit" id="sendBtn">
                    📤 Mesaj Gönder
                </button>
            </form>
            
            <div id="status" class="status-message"></div>
            
            <div class="api-info">
                <h3>🔗 API Kullanımı</h3>
                <p><strong>Endpoint:</strong> <code>POST /api/send</code></p>
                <p><strong>Docs:</strong> <a href="/api/docs" target="_blank">API Documentation</a></p>
            </div>
        </div>
    </div>
    
    <script>
        document.getElementById('emailForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
                subject: formData.get('subject'),
                message: formData.get('message'),
                senderEmail: formData.get('senderEmail')
            };

            const statusDiv = document.getElementById('status');
            const submitBtn = document.getElementById('sendBtn');
            
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Gönderiliyor...';
            
            try {
                const response = await fetch('/api/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    statusDiv.textContent = '✅ ' + result.message;
                    statusDiv.className = 'status-message success';
                    e.target.reset();
                } else {
                    statusDiv.textContent = '❌ ' + result.message;
                    statusDiv.className = 'status-message error';
                }
            } catch (error) {
                statusDiv.textContent = '❌ Bağlantı hatası: ' + error.message;
                statusDiv.className = 'status-message error';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '📤 Mesaj Gönder';
            }
        });
    </script>
</body>
</html>`;
}

// Get API documentation
function getAPIDocumentation() {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email API Documentation</title>
    <style>
        body { 
            font-family: 'Segoe UI', sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 0 20px rgba(0,0,0,0.1); 
        }
        h1 { color: #2d5a40; }
        h2 { color: #1a472a; border-bottom: 2px solid #2d5a40; padding-bottom: 5px; }
        .endpoint { 
            background: #e8f5e9; 
            padding: 15px; 
            border-radius: 5px; 
            margin: 15px 0; 
            border-left: 4px solid #2d5a40; 
        }
        code { 
            background: #f8f9fa; 
            padding: 2px 6px; 
            border-radius: 3px; 
            font-family: 'Monaco', monospace; 
        }
        pre { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto; 
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📧 Email API Documentation</h1>
        
        <h2>Base URL</h2>
        <code>https://sentmail.glitchidea.com</code>
        
        <h2>Authentication</h2>
        <p>No authentication required for public endpoints.</p>
        
        <div class="endpoint">
            <h3>Send Email</h3>
            <p><strong>POST</strong> <code>/api/send</code></p>
            
            <h4>Request Headers</h4>
            <pre>Content-Type: application/json</pre>
            
            <h4>Request Body</h4>
            <pre>{
  "subject": "string (required)",
  "message": "string (required)", 
  "senderEmail": "string (required, valid email)",
  "senderName": "string (optional)"
}</pre>
            
            <h4>Response</h4>
            <pre>{
  "success": true,
  "message": "Email başarıyla gönderildi",
  "messageId": "unique-message-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}</pre>
            
            <h4>Error Response</h4>
            <pre>{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}</pre>
        </div>
        
        <h2>JavaScript Example</h2>
        <pre>const response = await fetch('https://sentmail.glitchidea.com/api/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    subject: 'Test Subject',
    message: 'Hello, this is a test message!',
    senderEmail: 'user@example.com',
    senderName: 'John Doe'
  })
});

const result = await response.json();
console.log(result);</pre>
        
        <h2>Rate Limiting</h2>
        <p>10 requests per minute per IP address.</p>
        
        <h2>CORS</h2>
        <p>API allows requests from: <code>https://glitchidea.com</code></p>
    </div>
</body>
</html>`;
}
