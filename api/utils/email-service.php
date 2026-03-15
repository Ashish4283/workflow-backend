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
        $mail->Subject = "🔒 [Protocol Challenge] Verify Your Identity";
        
        // Premium Gamified Email Template
        $mail->Body = "
        <html>
        <head>
            <style>
                body { font-family: 'Inter', sans-serif; background-color: #0c0c0e; color: #ffffff; padding: 40px; }
                .container { max-width: 600px; margin: 0 auto; background: #16161a; border: 1px solid #1f1f23; border-radius: 24px; padding: 40px; text-align: center; }
                .logo { font-size: 24px; font-weight: 900; color: #6366f1; letter-spacing: -1px; margin-bottom: 30px; }
                .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
                .msg { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 30px; }
                .otp-container { background: #1e1e24; border: 2px dashed #312e81; border-radius: 16px; padding: 20px; margin-bottom: 30px; }
                .otp { font-size: 42px; font-weight: 900; color: #818cf8; letter-spacing: 12px; font-family: monospace; }
                .footer { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-top: 40px; border-top: 1px solid #1f1f23; padding-top: 20px; }
                .warning { color: #ef4444; font-size: 11px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='logo'>HORIZON OPS</div>
                <div class='title'>Identity Challenge Initialized</div>
                <p class='msg'>Hello <b>$userName</b>,<br>A request to access the Strategic Command Center was initiated. Enter the following neural synchronization code to verify your identity.</p>
                
                <div class='otp-container'>
                    <div class='otp'>$otp</div>
                </div>
                
                <p class='msg'>This code expires in 15 minutes. If you did not initiate this protocol, please ignore this signal.</p>
                
                <div class='footer'>
                    Neural Link v3.5 Secure Transmission<br>
                    Terminal ID: " . $_SERVER['REMOTE_ADDR'] . "
                    <div class='warning'>CONFIDENTIAL PROTOCOL - DO NOT SHARE THIS CODE</div>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $mail->AltBody = "Hello $userName, Your verification code is: $otp. Enter this code to verify your HORIZON identity.";

        return $mail->send();
    } catch (Exception $e) {
        error_log("MAIL_ERROR: System failed to dispatch email to $toEmail. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>
