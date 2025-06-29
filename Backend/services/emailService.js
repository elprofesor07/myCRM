const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Initialize email service based on environment
class EmailService {
  constructor() {
    this.from = process.env.EMAIL_FROM || 'noreply@crm.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'CRM System';
    
    if (process.env.SENDGRID_API_KEY) {
      // Use SendGrid in production
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.provider = 'sendgrid';
    } else {
      // Use nodemailer for development
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: process.env.SMTP_PORT || 1025,
        secure: false,
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        } : undefined
      });
      this.provider = 'smtp';
    }
  }

  async sendEmail(to, subject, html, text = null) {
    const msg = {
      to,
      from: {
        email: this.from,
        name: this.fromName
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, '') // Strip HTML for text version
    };

    try {
      if (this.provider === 'sendgrid') {
        await sgMail.send(msg);
      } else {
        await this.transporter.sendMail(msg);
      }
      
      logger.info(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async sendVerificationEmail(user, token) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
    
    const subject = 'Verify Your Email - CRM System';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CRM System!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.firstName},</h2>
            <p>Thank you for registering with our CRM System. To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="button">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #e9e9e9; padding: 10px; border-radius: 4px;">${verifyUrl}</p>
            <p>This link will expire in 24 hours for security reasons.</p>
            <p>If you didn't create an account with us, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>Why verify your email?</strong></p>
            <ul>
              <li>Secure your account and protect your data</li>
              <li>Receive important notifications and updates</li>
              <li>Reset your password if you forget it</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;
    
    const subject = 'Password Reset Request - CRM System';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .warning { background-color: #FEF2F2; border: 1px solid #FECACA; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.firstName},</h2>
            <p>We received a request to reset the password for your CRM System account. If you made this request, click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #e9e9e9; padding: 10px; border-radius: 4px;">${resetUrl}</p>
            <div class="warning">
              <p><strong>⚠️ Security Notice:</strong></p>
              <p>This link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>Tips for creating a strong password:</strong></p>
            <ul>
              <li>Use at least 8 characters</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Add numbers and special characters</li>
              <li>Avoid common words or personal information</li>
            </ul>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordChangeConfirmation(user) {
    const subject = 'Password Changed Successfully - CRM System';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          .alert { background-color: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Changed Successfully</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.firstName},</h2>
            <p>Your password has been successfully changed. You can now log in with your new password.</p>
            <div class="alert">
              <p><strong>🔒 Security Alert:</strong></p>
              <p>If you did not make this change, please contact our support team immediately and secure your account.</p>
            </div>
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>All your sessions on other devices have been logged out</li>
              <li>You'll need to log in again with your new password</li>
              <li>Update your password in any password managers you use</li>
            </ul>
            <p>Changed on: ${new Date().toLocaleString()}</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to CRM System - Get Started!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .feature { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4F46E5; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CRM System!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.firstName},</h2>
            <p>Your email has been verified and your account is now fully activated. We're excited to have you on board!</p>
            <p>Here's what you can do with our CRM System:</p>
            <div class="feature">
              <strong>📊 Manage Contacts & Companies</strong>
              <p>Keep track of all your business relationships in one place</p>
            </div>
            <div class="feature">
              <strong>💼 Track Deals & Opportunities</strong>
              <p>Monitor your sales pipeline and never miss an opportunity</p>
            </div>
            <div class="feature">
              <strong>✅ Organize Tasks & Activities</strong>
              <p>Stay on top of your to-dos and schedule activities efficiently</p>
            </div>
            <div class="feature">
              <strong>📈 Generate Reports & Insights</strong>
              <p>Make data-driven decisions with powerful analytics</p>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
            <p><strong>Need help getting started?</strong></p>
            <p>Check out our <a href="${process.env.CLIENT_URL}/help">Help Center</a> or contact our support team if you have any questions.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
            <p>This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendActivityReminder(user, activity) {
    const subject = `Reminder: ${activity.subject} - CRM System`;
    const activityUrl = `${process.env.CLIENT_URL}/activities/${activity._id}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .activity-box { background-color: white; padding: 20px; border-radius: 5px; border: 1px solid #ddd; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #F59E0B; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Activity Reminder</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.firstName},</h2>
            <p>This is a reminder about your upcoming activity:</p>
            <div class="activity-box">
              <h3>${activity.subject}</h3>
              <p><strong>Type:</strong> ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</p>
              <p><strong>Scheduled:</strong> ${new Date(activity.scheduledStart).toLocaleString()}</p>
              ${activity.location ? `<p><strong>Location:</strong> ${activity.location}</p>` : ''}
              ${activity.description ? `<p><strong>Description:</strong> ${activity.description}</p>` : ''}
            </div>
            <div style="text-align: center;">
              <a href="${activityUrl}" class="button">View Activity Details</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
            <p>You're receiving this because you have reminders enabled for your activities.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  async sendDealNotification(user, deal, type) {
    const subjects = {
      assigned: `New Deal Assigned: ${deal.title}`,
      stage_changed: `Deal Stage Updated: ${deal.title}`,
      won: `🎉 Deal Won: ${deal.title}`,
      lost: `Deal Lost: ${deal.title}`
    };

    const subject = subjects[type] || `Deal Update: ${deal.title}`;
    const dealUrl = `${process.env.CLIENT_URL}/deals/${deal._id}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${type === 'won' ? '#10B981' : type === 'lost' ? '#EF4444' : '#4F46E5'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .deal-box { background-color: white; padding: 20px; border-radius: 5px; border: 1px solid #ddd; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${type === 'won' ? '🎉 Congratulations!' : type === 'lost' ? 'Deal Update' : 'Deal Notification'}</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.firstName},</h2>
            ${type === 'won' ? '<p>Great news! A deal has been successfully closed!</p>' : 
              type === 'lost' ? '<p>A deal has been marked as lost. Here are the details:</p>' :
              type === 'assigned' ? '<p>A new deal has been assigned to you:</p>' :
              '<p>There has been an update to one of your deals:</p>'}
            <div class="deal-box">
              <h3>${deal.title}</h3>
              <p><strong>Value:</strong> ${deal.currency} ${deal.value.toLocaleString()}</p>
              <p><strong>Stage:</strong> ${deal.stage.replace(/_/g, ' ').charAt(0).toUpperCase() + deal.stage.slice(1).replace(/_/g, ' ')}</p>
              <p><strong>Expected Close:</strong> ${new Date(deal.expectedCloseDate).toLocaleDateString()}</p>
              ${deal.company ? `<p><strong>Company:</strong> ${deal.company.name || 'N/A'}</p>` : ''}
              ${type === 'lost' && deal.lostReason ? `<p><strong>Lost Reason:</strong> ${deal.lostReason}</p>` : ''}
            </div>
            <div style="text-align: center;">
              <a href="${dealUrl}" class="button">View Deal Details</a>
            </div>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} CRM System. All rights reserved.</p>
            <p>You're receiving this because you're involved in this deal.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;