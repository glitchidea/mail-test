# 📧 Email API Documentation

Bu API, GlitchIdea'nın email gönderim servisidir. Cloudflare Workers üzerinde çalışır ve SMTP protokolü kullanarak email gönderir.

## 🌐 Base URL
```
https://sentmail.glitchidea.com
```

## 🔗 Endpoints

### 1. Send Email
Yeni bir email gönderir.

**Endpoint:** `POST /api/send`

#### Request Headers
```http
Content-Type: application/json
```

#### Request Body
```json
{
  "subject": "string (zorunlu)",
  "message": "string (zorunlu)",
  "senderEmail": "string (zorunlu, geçerli email formatı)",
  "senderName": "string (opsiyonel)"
}
```

#### Response (Success)
```json
{
  "success": true,
  "message": "Email başarıyla gönderildi",
  "messageId": "unique-message-id",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### Response (Error)
```json
{
  "success": false,
  "message": "Hata açıklaması",
  "code": "ERROR_CODE"
}
```

### 2. API Documentation
API dokümantasyonu sayfasını görüntüler.

**Endpoint:** `GET /api/docs`

#### Response
HTML sayfası döner.

### 3. Contact Form
Test için web formu gösterir.

**Endpoint:** `GET /`

#### Response
HTML contact form sayfası döner.

## 🔒 Authentication
Bu API herhangi bir authentication gerektirmez. Public endpoint'tir.

## 🛡️ CORS Policy
API sadece aşağıdaki domain'den gelen istekleri kabul eder:
- `https://glitchidea.com`

## 📊 Rate Limiting
- **Limit:** IP başına dakikada 10 istek
- **Response:** 429 Too Many Requests
- **Reset:** 1 dakika sonra

## 🚫 Error Codes

| Code | Description |
|------|-------------|
| `RATE_LIMIT_EXCEEDED` | Çok fazla istek gönderildi |
| `INVALID_CONTENT_TYPE` | Content-Type application/json olmalı |
| `MISSING_FIELDS` | Gerekli alanlar eksik |
| `INVALID_EMAIL` | Geçersiz email formatı |
| `CONFIG_ERROR` | Sunucu yapılandırma hatası |
| `SEND_ERROR` | Email gönderim hatası |
| `NOT_FOUND` | Endpoint bulunamadı |

## 💻 Code Examples

### JavaScript (Fetch API)
```javascript
const sendEmail = async (subject, message, senderEmail, senderName = '') => {
  try {
    const response = await fetch('https://sentmail.glitchidea.com/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject,
        message,
        senderEmail,
        senderName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('Email sent successfully!', result.messageId);
      return result;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Email send failed:', error.message);
    throw error;
  }
};

// Kullanım
sendEmail(
  'Test Subject',
  'Bu bir test mesajıdır.',
  'user@example.com',
  'John Doe'
);
```

### JavaScript (Axios)
```javascript
const axios = require('axios');

const sendEmail = async (emailData) => {
  try {
    const response = await axios.post(
      'https://sentmail.glitchidea.com/api/send',
      emailData,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message);
    } else {
      throw new Error('Network error');
    }
  }
};

// Kullanım
sendEmail({
  subject: 'Test Subject',
  message: 'Bu bir test mesajıdır.',
  senderEmail: 'user@example.com',
  senderName: 'John Doe'
});
```

### PHP (cURL)
```php
<?php
function sendEmail($subject, $message, $senderEmail, $senderName = '') {
    $url = 'https://sentmail.glitchidea.com/api/send';
    
    $data = [
        'subject' => $subject,
        'message' => $message,
        'senderEmail' => $senderEmail,
        'senderName' => $senderName
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception("HTTP Error: $httpCode");
    }
    
    $result = json_decode($response, true);
    
    if (!$result['success']) {
        throw new Exception($result['message']);
    }
    
    return $result;
}

// Kullanım
try {
    $result = sendEmail(
        'Test Subject',
        'Bu bir test mesajıdır.',
        'user@example.com',
        'John Doe'
    );
    echo "Email sent successfully: " . $result['messageId'];
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

### Python (Requests)
```python
import requests
import json

def send_email(subject, message, sender_email, sender_name=''):
    url = 'https://sentmail.glitchidea.com/api/send'
    
    data = {
        'subject': subject,
        'message': message,
        'senderEmail': sender_email,
        'senderName': sender_name
    }
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        
        if result['success']:
            print(f"Email sent successfully: {result['messageId']}")
            return result
        else:
            raise Exception(result['message'])
            
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {e}")

# Kullanım
try:
    result = send_email(
        'Test Subject',
        'Bu bir test mesajıdır.',
        'user@example.com',
        'John Doe'
    )
except Exception as e:
    print(f"Error: {e}")
```

### jQuery
```javascript
const sendEmail = (subject, message, senderEmail, senderName = '') => {
  return $.ajax({
    url: 'https://sentmail.glitchidea.com/api/send',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
      subject,
      message,
      senderEmail,
      senderName
    })
  });
};

// Kullanım
sendEmail('Test Subject', 'Bu bir test mesajıdır.', 'user@example.com')
  .done(function(result) {
    if (result.success) {
      console.log('Email sent successfully!', result.messageId);
    } else {
      console.error('Error:', result.message);
    }
  })
  .fail(function(xhr) {
    console.error('Request failed:', xhr.statusText);
  });
```

### React Hook Example
```jsx
import { useState } from 'react';

const useEmailSender = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendEmail = async (emailData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://sentmail.glitchidea.com/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendEmail, loading, error };
};

// Kullanım
const ContactForm = () => {
  const { sendEmail, loading, error } = useEmailSender();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await sendEmail({
        subject: 'Contact Form',
        message: 'Test message',
        senderEmail: 'user@example.com'
      });
      
      console.log('Success:', result);
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Gönderiliyor...' : 'Gönder'}
      </button>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </form>
  );
};
```

## 🧪 Testing

### Test Endpoint
API'yi test etmek için:
```bash
curl -X POST https://sentmail.glitchidea.com/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Email",
    "message": "Bu bir test mesajıdır.",
    "senderEmail": "test@example.com",
    "senderName": "Test User"
  }'
```

### Test Form
Web üzerinden test için: https://sentmail.glitchidea.com

## 📈 Best Practices

### 1. Error Handling
Her zaman try-catch kullanın ve hataları uygun şekilde handle edin.

### 2. Input Validation
API çağrısı yapmadan önce email formatını validate edin:
```javascript
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

### 3. Loading States
Kullanıcı deneyimi için loading state'i gösterin.

### 4. Rate Limiting
Rate limiting'e takılmamak için istekleri throttle edin.

### 5. Security
- Asla API key'leri client-side'da expose etmeyin
- Input'ları sanitize edin
- HTTPS kullanın

## 🔧 Troubleshooting

### CORS Errors
- API'nin sadece `https://glitchidea.com` domain'inden çağrılabildiğini unutmayın
- Development için localhost'ta test ederken CORS proxy kullanabilirsiniz

### Network Errors
- İnternet bağlantısını kontrol edin
- API endpoint URL'sini doğrulayın
- Firewall ayarlarını kontrol edin

### Email Not Received
- Spam klasörünü kontrol edin
- SMTP ayarlarının doğru olduğundan emin olun
- Debug mode'u açarak detaylı log'ları inceleyin

## 📞 Support
Herhangi bir sorun yaşarsanız:
1. Bu dokümantasyonu kontrol edin
2. Browser developer console'daki hataları inceleyin
3. API response'larındaki error code'ları kontrol edin
