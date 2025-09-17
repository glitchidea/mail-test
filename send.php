<?php
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// GitHub Secrets'dan çevresel değişkenleri al
$GMAIL_USER = getenv('GMAIL_USER');
$GMAIL_PASS = getenv('GMAIL_PASS');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Form verilerini al
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $message = $_POST['message'] ?? '';
    
    // Basit doğrulama
    if (empty($name) || empty($email) || empty($message)) {
        http_response_code(400);
        echo "Tüm alanlar doldurulmalıdır.";
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo "Geçerli bir e-posta adresi giriniz.";
        exit;
    }

    try {
        $mail = new PHPMailer(true);
        
        // SMTP ayarları
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = $GMAIL_USER;
        $mail->Password = $GMAIL_PASS;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';

        // Alıcı ayarları
        $mail->setFrom($GMAIL_USER, $name);
        $mail->addAddress($GMAIL_USER, 'Glitch Idea');
        $mail->addReplyTo($email, $name);

        // İçerik
        $mail->isHTML(true);
        $mail->Subject = 'Yeni İletişim Formu Mesajı';
        $mail->Body = "
            <h3>Yeni İletişim Formu Mesajı</h3>
            <p><strong>İsim:</strong> {$name}</p>
            <p><strong>E-posta:</strong> {$email}</p>
            <p><strong>Mesaj:</strong><br>{$message}</p>
        ";
        $mail->AltBody = "İsim: {$name}\nE-posta: {$email}\n\nMesaj:\n{$message}";

        $mail->send();
        http_response_code(200);
        echo "Mesajınız başarıyla gönderildi.";
    } catch (Exception $e) {
        http_response_code(500);
        echo "Mesaj gönderilirken bir hata oluştu.";
    }
} else {
    http_response_code(403);
    echo "Geçersiz istek yöntemi.";
}
?>
