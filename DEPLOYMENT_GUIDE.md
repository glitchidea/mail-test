# 🚀 Cloudflare Workers Deployment Guide

Bu rehber, email API'nin Cloudflare Workers'a nasıl deploy edileceğini açıklar.

## 📋 Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Cloudflare hesabı
- Domain (glitchidea.com) Cloudflare'de yönetiliyor olmalı

## 🛠️ Kurulum

### 1. Wrangler CLI Kurulumu
```bash
npm install -g wrangler
```

### 2. Cloudflare'e Login
```bash
wrangler login
```

### 3. Proje Bağımlılıklarını Yükle
```bash
npm install
```

## 🔧 Yapılandırma

### 1. wrangler.toml Kontrolü
`wrangler.toml` dosyası zaten yapılandırılmış durumda. Gerekirse aşağıdaki ayarları kontrol edin:

```toml
name = "sentmail-api"
main = "worker.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

routes = [
  { pattern = "sentmail.glitchidea.com/*", custom_domain = true }
]
```

### 2. Environment Variables Ayarlama

#### Yöntem 1: Wrangler CLI ile
```bash
# SMTP ayarları
wrangler secret put SMTP_HOST
wrangler secret put SMTP_PORT  
wrangler secret put SMTP_USER
wrangler secret put SMTP_PASS
wrangler secret put SMTP_SECURE
wrangler secret put RECEIVER_EMAIL

# Debug ayarı
wrangler secret put DEBUG
```

#### Yöntem 2: Cloudflare Dashboard ile
1. [Cloudflare Dashboard](https://dash.cloudflare.com) > Workers & Pages
2. "sentmail-api" worker'ını seçin
3. Settings > Variables
4. "Add variable" ile gerekli değişkenleri ekleyin

## 🚀 Deployment

### 1. İlk Deployment
```bash
# Development ortamında test
npm run dev

# Production'a deploy
npm run deploy
```

### 2. Custom Domain Yapılandırması

#### Cloudflare Dashboard'da:
1. Workers & Pages > sentmail-api
2. Triggers sekmesi
3. Custom Domains > Add Custom Domain
4. `sentmail.glitchidea.com` ekleyin

#### DNS Ayarları:
Cloudflare DNS'de aşağıdaki kaydı ekleyin:
```
Type: CNAME
Name: sentmail
Content: sentmail-api.your-subdomain.workers.dev
Proxy status: Proxied (orange cloud)
```

## ✅ Doğrulama ve Test

### 1. API Endpoint Testi
```bash
curl -X POST https://sentmail.glitchidea.com/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Email",
    "message": "Bu bir test mesajıdır.",
    "senderEmail": "test@example.com"
  }'
```

### 2. Web Form Testi
Tarayıcıda https://sentmail.glitchidea.com adresine gidin ve formu test edin.

### 3. CORS Testi
glitchidea.com sitesinden API çağrısı yaparak CORS ayarlarını test edin.

## 📊 Monitoring ve Logs

### Real-time Logs
```bash
npm run logs
```

### Cloudflare Analytics
Dashboard'da Analytics sekmesinden:
- Request sayıları
- Error rate'ler
- Response time'lar
- Geographic dağılım

## 🔄 Update ve Maintenance

### Kod Güncellemeleri
```bash
# Değişiklikleri yap
git add .
git commit -m "Update email API"

# Deploy et
npm run deploy
```

### Environment Variables Güncelleme
```bash
wrangler secret put VARIABLE_NAME
```

### Worker Silme (Gerekirse)
```bash
wrangler delete sentmail-api
```

## 🐛 Troubleshooting

### Yaygın Sorunlar

#### 1. "Module not found" Hatası
```bash
# Node.js compatibility flag'ini kontrol edin
# wrangler.toml'da compatibility_flags = ["nodejs_compat"] olduğundan emin olun
```

#### 2. CORS Hataları
```javascript
// worker.js'de corsHeaders'ın doğru olduğundan emin olun
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://glitchidea.com',
  // ...
};
```

#### 3. SMTP Bağlantı Hataları
```bash
# Environment variables'ları kontrol edin
wrangler secret list

# SMTP ayarlarını test edin
# Debug mode'u açın: DEBUG=true
```

#### 4. Custom Domain Çalışmıyor
- DNS propagation bekleme süresi (24 saat)
- Cloudflare proxy'nin aktif olduğunu kontrol edin
- SSL/TLS ayarlarını kontrol edin

### Debug Komutları

```bash
# Local development
wrangler dev --local

# Remote logs
wrangler tail

# Environment variables listesi
wrangler secret list

# Worker bilgileri
wrangler whoami
```

## 📈 Production Checklist

- [ ] Environment variables ayarlandı
- [ ] Custom domain yapılandırıldı
- [ ] SSL/TLS sertifikası aktif
- [ ] SMTP ayarları test edildi
- [ ] CORS politikası doğru
- [ ] Rate limiting aktif
- [ ] Error handling çalışıyor
- [ ] Logs akışı normal
- [ ] Monitoring kuruldu
- [ ] DEBUG=false (production için)

## 🔐 Security Notes

1. **Environment Variables**: Tüm hassas bilgiler encrypted olarak saklanmalı
2. **CORS**: Sadece glitchidea.com domain'ine izin veriliyor
3. **Rate Limiting**: IP başına dakikada 10 istek limiti
4. **Input Validation**: Tüm input'lar validate ediliyor
5. **Error Messages**: Production'da detaylı hata bilgileri gizleniyor

## 📞 Support ve İletişim

Deployment sırasında sorun yaşarsanız:

1. **Logs kontrol edin**: `npm run logs`
2. **Cloudflare Dashboard**: Analytics ve Real-time logs
3. **Bu rehberi takip edin**: Adımları tekrar gözden geçirin
4. **SMTP Provider**: Provider dokümantasyonunu kontrol edin

## 🔄 CI/CD (Opsiyonel)

GitHub Actions ile otomatik deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm install
    - run: npm run deploy
      env:
        CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```
