<?php
// api/utils/email-service.php

function sendOTP($toEmail, $otp, $userName) {
    $subject = "🔒 [Protocol Challenge] Verify Your Identity";
    
    // Premium Gamified Email Template
    $message = "
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
            .footer { font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-top: 40px; border-top: 1px solid #1f1f23; pt: 20px; }
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

    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    
    // Get sender from env or fallback
    $from = get_env_var('EMAIL_FROM', 'no-reply@creative4ai.com');
    $headers .= "From: Horizon Ops <$from>" . "\r\n";

    // Use built-in mail() as default, but structure for easy SMTP enhancement
    // Note: On many servers, mail() works out of the box. 
    // For local testing, this will only work if an MTA is configured.
    try {
        $success = mail($toEmail, $subject, $message, $headers);
        if (!$success) {
            error_log("MAIL_ERROR: System failed to dispatch email to $toEmail");
        }
        return $success;
    } catch (Exception $e) {
        error_log("MAIL_EXCEPTION: " . $e->getMessage());
        return false;
    }
}
?>
