# 📧 Node.js Email Gönderici Backend

NPM frontend sitenize entegre etmek için Node.js backend.

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükle
```bash
npm install
```

### 2. Server'ı Başlat
```bash
npm start
```

### 3. Geliştirme Modu (Otomatik Yeniden Başlatma)
```bash
npm run dev
```

<!-- Test komutları kaldırıldı -->

## 📁 Dosya Yapısı

```
tester/
├── package.json          # NPM konfigürasyonu
├── server.js             # Ana server dosyası
├── config.env            # Gizli konfigürasyon
├── public/
│   └── index.html        # Test sayfası
└── README.md            # Bu dosya
```

## 🔧 API Endpoints

### POST /send-email
Email gönderme endpoint'i

**Request:**
```json
{
  "subject": "Test Konu",
  "message": "Test mesajı",
  "senderName": "TestUser"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mesajınız başarıyla gönderildi!",
  "timestamp": "2025-01-16T02:35:43.000Z"
}
```

<!-- test-email endpoint'i kaldırıldı -->

### GET /status
Server durumu endpoint'i

**Response:**
```json
{
  "status": "OK",
  "message": "Email Sender Backend çalışıyor",
  "timestamp": "2025-01-16T02:35:43.000Z",
  "environment": "development",
  "port": 3001
}
```

## 📧 Email Konfigürasyonu

`config.env` dosyasını düzenleyin:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
TO_EMAIL=info@yourdomain.com
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Your Company Name

# Server Configuration
PORT=3001
NODE_ENV=development

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080,http://localhost:3001
```

## 🎯 NPM Frontend Entegrasyonu

### React Component Örneği:

```jsx
import React, { useState } from 'react';

const EmailForm = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    senderName: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus('');

    try {
      const response = await fetch('http://localhost:3001/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setStatus('✅ Mesaj başarıyla gönderildi!');
        setFormData({ subject: '', message: '', senderName: '' });
      } else {
        setStatus(`❌ Hata: ${result.message}`);
      }
    } catch (error) {
      setStatus('❌ Bağlantı hatası!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Konu:</label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({...formData, subject: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Mesaj:</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required
        />
      </div>
      
      <div>
        <label>Gönderen Adı:</label>
        <input
          type="text"
          value={formData.senderName}
          onChange={(e) => setFormData({...formData, senderName: e.target.value})}
          required
        />
      </div>
      
      <button type="submit" disabled={loading}>
        {loading ? '⏳ Gönderiliyor...' : '📤 Mesaj Gönder'}
      </button>
      
      {status && <div className="status">{status}</div>}
    </form>
  );
};

export default EmailForm;
```

<!-- Test bölümü kaldırıldı -->

## 🌩️ Cloudflare Pages Deployment

### 1. Cloudflare Pages'de Proje Oluşturma
1. Cloudflare Dashboard'a gidin
2. Pages > Create a project > Connect to Git
3. Repository'nizi seçin
4. Build settings:
   - Framework preset: None
   - Build command: `npm install`
   - Build output directory: `/public`

### 2. Environment Variables Ayarları
Cloudflare Pages > Your Project > Settings > Environment variables bölümünde aşağıdaki değişkenleri "Secret" olarak ekleyin:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `TO_EMAIL`
- `FROM_EMAIL`
- `FROM_NAME`
- `ALLOWED_ORIGINS`

Not: Production ortamında `ALLOWED_ORIGINS` değerini Cloudflare Pages domain'inize göre güncelleyin.

## 🔒 Güvenlik

- ✅ **Environment konfigürasyonu** - Cloudflare Pages Secrets ile güvenli saklama
- ✅ **CORS kontrolü** - Sadece belirtilen origin'ler
- ✅ **Input validasyonu** - Güvenli veri işleme
- ✅ **Error handling** - Güvenli hata yönetimi

## 📝 Lisans

Bu proje MIT lisansı altındadır.
