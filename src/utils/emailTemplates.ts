export const getPasswordResetTemplate = (url: string) => ({
  subject: "Password Reset Request",
  text:
    "You requested a password reset. Click on the link to reset your password: " +
    url,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #1a1a1a;
            color: #e0e0e0;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #2a2a2a;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .header {
            background-color: #3a3a3a;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        h1 {
            color: #4a90e2;
            margin-bottom: 20px;
        }
        p {
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .btn {
            display: inline-block;
            background-color: #4a90e2;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .btn:hover {
            background-color: #357abd;
        }
        .footer {
            background-color: #3a3a3a;
            text-align: center;
            padding: 15px;
            font-size: 0.8em;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            <p>To reset your password, click the button below:</p>
            <p style="text-align: center;">
                <a href="${url}" target="_blank" class="btn">Reset Password</a> 
            </p>
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all;">${url}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>Best regards,<br>Your Support Team</p>
        </div>
        <div class="footer">
            &copy; 2023 Your Company Name. All rights reserved.
        </div>
    </div>
</body>
</html>
  `,
});

export const getVerifyEmailTemplate = (url: string) => ({
  subject: "Verify Your Email Address",
  text: "Please verify your email address by clicking on this link: " + url,
  html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background-color: #1a1a1a;
            color: #e0e0e0;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #2a2a2a;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .header {
            background-color: #3a3a3a;
            padding: 20px;
            text-align: center;
        }
        .content {
            padding: 30px;
        }
        h1 {
            color: #4ae2a0;
            margin-bottom: 20px;
        }
        p {
            line-height: 1.6;
            margin-bottom: 25px;
        }
        .btn {
            display: inline-block;
            background-color: #4ae2a0;
            color: #1a1a1a;
            text-decoration: none;
            padding: 12px 25px;
            border-radius: 5px;
            font-weight: bold;
            transition: background-color 0.3s ease;
        }
        .btn:hover {
            background-color: #3bc589;
        }
        .footer {
            background-color: #3a3a3a;
            text-align: center;
            padding: 15px;
            font-size: 0.8em;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email Address</h1>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Thank you for signing up! To complete your registration and ensure the security of your account, we need to verify your email address.</p>
            <p>Please click the button below to verify your email:</p>
            <p style="text-align: center;">
                <a href="${url}" target="_blank" class="btn">Verify Email</a> 
            </p>
            <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
            <p style="word-break: break-all;">${url}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with us, please disregard this email.</p>
            <p>Best regards,<br>Your Support Team</p>
        </div>
        <div class="footer">
            &copy; 2023 Your Company Name. All rights reserved.
        </div>
    </div>
</body>
</html>
  `,
});
