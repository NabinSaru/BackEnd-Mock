const transporter = require('../config/mailer');

const sendEmail = async ({ to, subject, html, from, text }) => {
  await transporter.sendMail({
    from: `"Your App" <${process.env.SMTP_USER}>`,
    to,
    from,
    subject,
    text,
    html,
  });
};

module.exports = sendEmail;