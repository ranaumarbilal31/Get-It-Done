const nodemailer = require('nodemailer');

// Configure transporter if credentials provided
const createTransporter = () => {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Get It Done" <noreply@get-it-done.local>',
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email Service] Sent email to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[Email Service] Error sending real email, falling back to log:', error.message);
    }
  }

  // Logging queue handler
  console.log('====================================================');
  console.log(`[Email Dispatch Service - Delivery Pipeline]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${text || html}`);
  console.log('====================================================');
  return { success: true, simulated: true };
};

const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Get It Done!',
    html: `
      <h2>Welcome to Get It Done, ${user.name}!</h2>
      <p>Thank you for joining our community task marketplace.</p>
      <p>Whether you are looking to get things done or earn money as a Tasker, we are excited to have you on board!</p>
    `,
    text: `Welcome to Get It Done, ${user.name}! Start exploring tasks or post your own.`,
  });
};

const sendOfferNotificationEmail = async (posterEmail, taskTitle, taskerName, amount) => {
  return sendEmail({
    to: posterEmail,
    subject: `New Offer on your task: "${taskTitle}"`,
    html: `
      <h3>You received a new offer!</h3>
      <p><strong>${taskerName}</strong> has made an offer of <strong>$${amount}</strong> on your task: <em>"${taskTitle}"</em>.</p>
      <p>Visit Get It Done to review their proposal, reviews, and accept the offer.</p>
    `,
    text: `${taskerName} offered $${amount} on your task "${taskTitle}". Check it out on Get It Done.`,
  });
};

const sendOfferAcceptedEmail = async (taskerEmail, taskTitle, posterName) => {
  return sendEmail({
    to: taskerEmail,
    subject: `Congratulations! Your offer was accepted for "${taskTitle}"`,
    html: `
      <h3>Your offer was accepted!</h3>
      <p><strong>${posterName}</strong> has accepted your offer on: <em>"${taskTitle}"</em>.</p>
      <p>Funds are now held safely in Get It Done Platform Escrow. You can now chat directly with the poster and coordinate the job.</p>
    `,
    text: `Your offer on "${taskTitle}" was accepted by ${posterName}! Payment is secured in escrow.`,
  });
};

const sendContactInquiryEmail = async ({ name, email, subject, category, message }) => {
  return sendEmail({
    to: 'ranaumarbilal31@gmail.com',
    subject: `[Get It Done Inquiry] ${subject} (${category || 'General'})`,
    html: `
      <h3>New Customer Support Inquiry</h3>
      <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
      <p><strong>Category:</strong> ${category || 'General'}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <blockquote style="background:#f4f4f5;padding:12px;border-left:4px solid #14b8a6;">
        ${message.replace(/\n/g, '<br/>')}
      </blockquote>
    `,
    text: `New Inquiry from ${name} (${email})\nCategory: ${category}\nSubject: ${subject}\n\nMessage:\n${message}`,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendOfferNotificationEmail,
  sendOfferAcceptedEmail,
  sendContactInquiryEmail,
};
