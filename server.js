require('dotenv').config({ path: './config.env' });
const app = require('./app');

const PORT = process.env.PORT || 7590;

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('📧 Email Sender Backend');
    console.log('='.repeat(50));
    console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
    console.log(`📧 Email API: http://localhost:${PORT}/send-email`);
    console.log(`📊 Status: http://localhost:${PORT}/status`);
    console.log('='.repeat(50));
    console.log('⏹️  Durdurmak için Ctrl+C tuşlarına basın');
    console.log('='.repeat(50));
});
