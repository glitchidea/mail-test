# Cloudflare Environment Variables Setup Guide

Bu rehber, Cloudflare Workers için gerekli environment variables'ların nasıl ayarlanacağını açıklar.

## 🔧 Gerekli Environment Variables

Aşağıdaki environment variables'ları Cloudflare Dashboard'da ayarlamanız gerekiyor:

### SMTP Ayarları
```
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-smtp-username@yourdomain.com
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
```

### Email Ayarları
```
RECEIVER_EMAIL=info@glitchidea.com
DEBUG=false
```

## 📋 Cloudflare Dashboard'da Environment Variables Ekleme

### Adım 1: Cloudflare Dashboard'a Giriş
1. [Cloudflare Dashboard](https://dash.cloudflare.com) adresine gidin
2. Hesabınıza giriş yapın

### Adım 2: Workers & Pages Sekmesi
1. Sol menüden **"Workers & Pages"** sekmesine tıklayın
2. **"sentmail-api"** worker'ınızı bulun ve tıklayın

### Adım 3: Settings Sekmesi
1. Worker detay sayfasında **"Settings"** sekmesine tıklayın
2. **"Variables"** bölümünü bulun

### Adım 4: Environment Variables Ekleme
1. **"Add variable"** butonuna tıklayın
2. Her bir variable için:
   - **Variable name**: Yukarıdaki listeden variable adını girin
   - **Value**: İlgili değeri girin
   - **Encrypt**: Hassas bilgiler için (SMTP_PASS gibi) bu seçeneği işaretleyin
3. **"Save"** butonuna tıklayın

## 🔒 SMTP Provider Önerileri

### Gmail SMTP (Kişisel/Test için)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=false
```

**Not:** Gmail için App Password kullanmanız gerekir:
1. Google Account Security sayfasına gidin
2. 2-Step Verification'ı aktif edin
3. App Passwords bölümünden yeni password oluşturun

### Outlook/Hotmail SMTP
```
SMTP_HOST=smtp.live.com
SMTP_PORT=587
SMTP_USER=youremail@outlook.com
SMTP_PASS=your-password
SMTP_SECURE=false
```

### Profesyonel SMTP Servisleri

#### SendGrid
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_SECURE=false
```

#### Mailgun
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
SMTP_SECURE=false
```

#### Amazon SES
```
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
SMTP_SECURE=false
```

## 🚀 Deployment Sonrası Test

### 1. Worker'ı Deploy Edin
```bash
wrangler publish
```

### 2. Custom Domain Ayarlayın
1. Cloudflare Dashboard'da **"Workers & Pages"** > **"sentmail-api"**
2. **"Triggers"** sekmesine gidin
3. **"Custom Domains"** bölümünde **"Add Custom Domain"**
4. **"sentmail.glitchidea.com"** girin ve kaydedin

### 3. API'yi Test Edin
```bash
curl -X POST https://sentmail.glitchidea.com/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Email",
    "message": "Bu bir test mesajıdır.",
    "senderEmail": "test@example.com"
  }'
```

### 4. Frontend'den Test Edin
1. https://glitchidea.com adresinizden form doldurun
2. Developer Console'da network tabını kontrol edin
3. API yanıtlarını inceleyin

## 🔍 Debug Modu

Production'da sorun yaşarsanız debug modunu aktif edebilirsiniz:

```
DEBUG=true
```

Bu mod aktifken API yanıtlarında detaylı hata bilgileri döner.

**Önemli:** Production'da debug modunu kapalı tutun!

## 📊 Monitoring

### Cloudflare Analytics
- Dashboard'da **"Analytics"** sekmesinden istekleri takip edebilirsiniz
- Error rate ve response time'ları görüntüleyebilirsiniz

### Console Logs
- Worker logs için **"Logs"** sekmesini kullanın
- Real-time logları görüntülemek için **"Real-time logs"** aktif edin

## 🔧 Troubleshooting

### Yaygın Hatalar

#### CORS Hataları
- API endpoint'inin `https://sentmail.glitchidea.com` olduğundan emin olun
- Frontend'in `https://glitchidea.com` domain'inden çağrı yaptığından emin olun

#### SMTP Bağlantı Hataları
- SMTP credentials'ları kontrol edin
- SMTP_HOST ve SMTP_PORT doğru olduğundan emin olun
- Firewall/güvenlik ayarlarını kontrol edin

#### Rate Limiting
- IP başına dakikada 10 istek limiti var
- Test ederken bu limiti aşmamaya dikkat edin

## 📝 Environment Variables Kontrol Listesi

- [ ] SMTP_HOST ayarlandı
- [ ] SMTP_PORT ayarlandı (genellikle 587)
- [ ] SMTP_USER ayarlandı
- [ ] SMTP_PASS ayarlandı (encrypted olarak)
- [ ] SMTP_SECURE ayarlandı (genellikle false)
- [ ] RECEIVER_EMAIL ayarlandı
- [ ] DEBUG ayarlandı (production'da false)
- [ ] Custom domain (sentmail.glitchidea.com) yapılandırıldı
- [ ] CORS ayarları doğru (glitchidea.com için)

## 🆘 Destek

Herhangi bir sorun yaşarsanız:
1. Cloudflare Worker logs'unu kontrol edin
2. Browser developer console'da network hatalarını inceleyin
3. SMTP provider'ınızın documentation'ını kontrol edin
4. Bu guide'daki adımları tekrar gözden geçirin
