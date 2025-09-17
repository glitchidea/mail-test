<?php
require 'config.php';
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// CSRF koruması
session_start();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.php?status=error');
    exit;
}

// Form verilerini al ve temizle
$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$message = filter_input(INPUT_POST, 'message', FILTER_SANITIZE_STRING);

// Validasyon
if (empty($name) || empty($email) || empty($message)) {
    header('Location: index.php?status=error');
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: index.php?status=error');
    exit;
}

try {
    $mail = new PHPMailer(true);
    
    // SMTP ayarları
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = GMAIL_USER;
    $mail->Password = GMAIL_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';

    // Alıcı ayarları
    $mail->setFrom(GMAIL_USER, $name);
    $mail->addAddress(GMAIL_USER, 'Glitch Idea');
    $mail->addReplyTo($email, $name);

    // Mail içeriği
    $mail->isHTML(true);
    $mail->Subject = 'Yeni İletişim Formu Mesajı';
    
    // HTML içerik
    $mail->Body = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;'>
                Yeni İletişim Formu Mesajı
            </h2>
            
            <div style='background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;'>
                <p><strong>Gönderen:</strong> {$name}</p>
                <p><strong>E-posta:</strong> {$email}</p>
            </div>
            
            <div style='background: #fff; padding: 15px; border-radius: 5px; border: 1px solid #ddd;'>
                <h3 style='color: #555; margin-top: 0;'>Mesaj:</h3>
                <p style='white-space: pre-wrap;'>{$message}</p>
            </div>
            
            <div style='margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;'>
                Bu e-posta iletişim formundan gönderilmiştir.
                <br>
                Tarih: " . date('d.m.Y H:i:s') . "
            </div>
        </div>
    ";
    
    // Düz metin alternatif içerik
    $mail->AltBody = "Gönderen: {$name}\nE-posta: {$email}\n\nMesaj:\n{$message}";

    $mail->send();
    header('Location: index.php?status=success');
} catch (Exception $e) {
    error_log("Mail gönderme hatası: " . $e->getMessage());
    header('Location: index.php?status=error');
}
?>
