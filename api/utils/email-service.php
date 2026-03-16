<?php
// api/utils/email-service.php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

require_once __DIR__ . '/../vendor/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../vendor/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../vendor/PHPMailer/src/SMTP.php';

function sendOTP($toEmail, $otp, $userName) {
    $mail = new PHPMailer(true);

    try {
        // --- SMTP CONFIGURATION ---
        $mail->isSMTP();
        $mail->Host       = get_env_var('SMTP_HOST', 'smtp.hostinger.com');
        $mail->SMTPAuth   = true;
        $mail->Username   = get_env_var('SMTP_USER', 'jessica@creative4ai.com');
        $mail->Password   = get_env_var('MAILBOX_PASSWORD'); // Pulled from protected .env
        $mail->SMTPSecure = get_env_var('SMTP_SECURE', 'ssl');
        $mail->Port       = (int)get_env_var('SMTP_PORT', 465);

        // --- SENDER & RECIPIENT ---
        $mail->setFrom(
            get_env_var('EMAIL_FROM', 'noreply@creative4ai.com'), 
            get_env_var('EMAIL_FROM_NAME', 'Creative4AI Verification')
        );
        $mail->addAddress($toEmail, $userName);

        // --- CONTENT ---
        $mail->isHTML(true);
        $mail->Subject = "Verify your Creative4AI account";
        
        // Professional Creative4AI Verification Template
        $mail->Body = "
        <html>
        <head>
            <style>
                body { font-family: 'Inter', -apple-system, sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; margin: 0; }
                .container { max-width: 500px; margin: 0 auto; background: #16161a; border: 1px solid #1f1f23; border-radius: 20px; padding: 40px; text-align: center; }
                .logo { font-size: 22px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; margin-bottom: 25px; text-transform: uppercase; }
                .title { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 12px; }
                .msg { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 25px; }
                .otp-card { background: #1e1e24; border: 1px solid #312e81; border-radius: 12px; padding: 25px; margin-bottom: 25px; }
                .otp { font-size: 36px; font-weight: 800; color: #818cf8; letter-spacing: 8px; font-family: 'Courier New', monospace; }
                .footer { font-size: 11px; color: #475569; margin-top: 30px; border-top: 1px solid #1f1f23; padding-top: 20px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='logo'>Creative<span style='color: #ffffff;'>4AI</span></div>
                <div class='title'>Identity Verification</div>
                <p class='msg'>Hello <b>$userName</b>,<br>Welcome to Creative4AI. To complete your registration and secure your account, please enter the following verification code:</p>
                
                <div class='otp-card'>
                    <div class='otp'>$otp</div>
                </div>
                
                <p class='msg' style='font-size: 13px;'>This code will expire in 15 minutes. If you did not sign up for a Creative4AI account, you can safely ignore this email.</p>
                
                <div class='footer'>
                    Secure Transmission via Creative4AI Identity Services<br>
                    IP: " . $_SERVER['REMOTE_ADDR'] . "
                </div>
            </div>
        </body>
        </html>
        ";
        
        $mail->AltBody = "Hello $userName, welcome to Creative4AI! Your verification code is: $otp. Enter this code to verify your identity.";

        return $mail->send();
    } catch (\Throwable $e) {
        error_log("MAIL_ERROR: System failed to dispatch email to $toEmail. Fault: " . $e->getMessage());
        return false;
    }
}
?>
