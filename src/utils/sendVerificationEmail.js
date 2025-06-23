const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, verificationLink) => {
    try {

    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
          user: process.env.EMAIL_USER, 
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: `"Opal Spaces" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - Opal Spaces',
        html: `
          <div style="font-family: sans-serif; line-height: 1.5">
            <h2>Welcome to Opal Spaces 👋</h2>
            <p>Thanks for registering! Please verify your email by clicking the link below:</p>
            <a href="${verificationLink}" style="color: blue">${verificationLink}</a>
            <p>This link will expire in 24 hours.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }


};

module.exports = sendVerificationEmail;