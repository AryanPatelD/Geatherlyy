import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from './mailer.service';

export interface NotificationData {
  // User info
  userName: string;
  userEmail: string;
  
  // Club info
  clubName?: string;
  clubId?: number;
  
  // Activity/Event info
  activityTitle?: string;
  activityDate?: Date;
  activityLocation?: string;
  activityType?: string;
  
  // Approval info
  requestType?: string;
  status?: 'APPROVED' | 'REJECTED' | 'PENDING';
  reason?: string;
  reviewerName?: string;
  
  // Additional context
  additionalMessage?: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  constructor(private mailerService: MailerService) {}

  // ==================== BASE TEMPLATE ====================
  
  private generateEmailHtml(title: string, bodyParagraphs: string[], buttonText: string, buttonUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geatherlyy Notification</title>
    <style>
        body {
            background-color: #f8f9fa;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }

        .card {
            background: white;
            width: 500px;
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-top: 5px solid #1a73e8;
            overflow: hidden;
        }

        .content {
            padding: 40px;
        }

        .logo-section {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
        }

        .logo-icon {
            width: 24px;
            height: 24px;
            background-color: #000;
            transform: rotate(45deg);
            margin-right: 10px;
        }

        .brand-name {
            font-size: 22px;
            font-weight: bold;
            color: #1a1a1b;
        }

        h1 {
            font-size: 28px;
            color: #1a1a1b;
            margin-bottom: 20px;
            font-weight: 500;
        }

        p {
            color: #5f6368;
            line-height: 1.6;
            font-size: 15px;
            margin-bottom: 20px;
        }

        .highlight {
            font-weight: bold;
            color: #1a1a1b;
        }

        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #1a73e8;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }

        .info-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #70757a;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .info-value {
            font-size: 15px;
            color: #1a1a1b;
            font-weight: 500;
        }

        .status-approved {
            color: #0d9488;
            font-weight: bold;
        }

        .status-rejected {
            color: #dc2626;
            font-weight: bold;
        }

        .status-pending {
            color: #d97706;
            font-weight: bold;
        }

        .btn {
            background-color: #1a73e8;
            color: white !important;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            text-decoration: none;
            transition: background 0.2s;
        }

        .btn:hover {
            background-color: #1557b0;
        }

        .btn-icon {
            margin-right: 8px;
            font-size: 18px;
        }

        .footer {
            border-top: 1px solid #eee;
            padding: 30px 40px;
            color: #70757a;
            font-size: 14px;
        }

        .footer a {
            color: #1a73e8;
            text-decoration: none;
        }

        .signature {
            margin-top: 20px;
            line-height: 1.4;
        }

        ul {
            color: #5f6368;
            line-height: 1.8;
            font-size: 15px;
            padding-left: 20px;
        }

        li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>

    <div class="card">
        <div class="content">
            <div class="logo-section">
                <div class="logo-icon"></div>
                <span class="brand-name">Geatherlyy</span>
            </div>

            <h1>${title}</h1>

            ${bodyParagraphs.join('\n            ')}

            <a href="${buttonUrl}" class="btn">
                <span class="btn-icon">✨</span> ${buttonText}
            </a>
        </div>

        <div class="footer">
            <div class="disclaimer">
                <p style="font-size: 12px; color: #70757a; margin-bottom: 15px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left: 3px solid #1a73e8;">
                    <strong>📌 Disclaimer:</strong> This is an automated notification from Geatherlyy. If you have any further issues, queries, or concerns, please contact the <strong>Club Administrator</strong> or your <strong>Faculty Mentor</strong> for assistance.
                </p>
            </div>
            Having trouble with your account? <a href="${this.frontendUrl}/contact">Contact us</a>
            <div class="signature">
                Best,<br>
                <strong>~ Geatherlyy team</strong>
            </div>
        </div>
    </div>

</body>
</html>`;
  }

  // ==================== WELCOME/JOIN NOTIFICATIONS ====================

  /**
   * Send welcome email when a member joins a club
   */
  async sendWelcomeEmail(data: NotificationData): Promise<void> {
    const bodyParagraphs = [
      `<p>Thank you for joining our <span class="highlight">${data.clubName}!</span> We are thrilled to have you as part of our community. Explore with us to unlock new experiences every day.</p>`,
      `<p>Stay connected with club activities, events, and resources to make the most of your membership.</p>`
    ];

    const html = this.generateEmailHtml(
      `Welcome To ${data.clubName}`,
      bodyParagraphs,
      'View Club',
      `${this.frontendUrl}/dashboard/clubs/${data.clubId}`
    );
    
    try {
      await this.mailerService.sendMail(
        data.userEmail,
        `Welcome to ${data.clubName}!`,
        html
      );
      this.logger.log(`Welcome email sent to ${data.userEmail} for club ${data.clubName}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email: ${error.message}`);
    }
  }

  // ==================== REMOVAL NOTIFICATIONS ====================

  /**
   * Send notification when a member is removed from a club
   */
  async sendRemovalNotification(data: NotificationData): Promise<void> {
    const bodyParagraphs = [
      `<p>We regret to inform you that your membership in <span class="highlight">${data.clubName}</span> has been terminated.</p>`,
      data.reason ? `
            <div class="info-box">
                <div class="info-label">Reason</div>
                <div class="info-value">${data.reason}</div>
            </div>` : '',
      `<p>If you believe this was done in error, please contact the club administrators or your faculty mentor. You can also explore and join other clubs on Geatherlyy.</p>`
    ].filter(p => p);

    const html = this.generateEmailHtml(
      'Club Membership Update',
      bodyParagraphs,
      'Discover Other Clubs',
      `${this.frontendUrl}/dashboard/discover`
    );
    
    try {
      await this.mailerService.sendMail(
        data.userEmail,
        `Club Membership Update - ${data.clubName}`,
        html
      );
      this.logger.log(`Removal notification sent to ${data.userEmail} for club ${data.clubName}`);
    } catch (error) {
      this.logger.error(`Failed to send removal notification: ${error.message}`);
    }
  }

  /**
   * Send notification to coordinator when removal request is processed
   */
  async sendRemovalRequestUpdateToCoordinator(data: NotificationData): Promise<void> {
    const statusClass = data.status === 'APPROVED' ? 'status-approved' : 'status-rejected';
    const statusText = data.status === 'APPROVED' ? 'Approved' : 'Rejected';
    
    const bodyParagraphs = [
      `<p>Your request to remove a member from <span class="highlight">${data.clubName}</span> has been reviewed.</p>`,
      `<div class="info-box">
                <div class="info-label">Status</div>
                <div class="info-value ${statusClass}">${statusText}</div>
            </div>`,
      data.additionalMessage ? `
            <div class="info-box">
                <div class="info-label">Reviewer Notes</div>
                <div class="info-value">${data.additionalMessage}</div>
            </div>` : '',
      `<p>You can view the updated member list in your club management dashboard.</p>`
    ].filter(p => p);

    const html = this.generateEmailHtml(
      'Removal Request Update',
      bodyParagraphs,
      'View Club Management',
      `${this.frontendUrl}/dashboard/manage`
    );
    
    try {
      await this.mailerService.sendMail(
        data.userEmail,
        `Removal Request ${statusText} - ${data.clubName}`,
        html
      );
      this.logger.log(`Removal request update sent to coordinator ${data.userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send removal request update: ${error.message}`);
    }
  }

  // ==================== EVENT/ACTIVITY NOTIFICATIONS ====================

  /**
   * Send notification about new activity/event to club members
   */
  async sendActivityNotification(data: NotificationData): Promise<void> {
    const formattedDate = data.activityDate 
      ? new Date(data.activityDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'To Be Announced';

    const bodyParagraphs = [
      `<p><span class="highlight">${data.clubName}</span> has announced a new ${data.activityType?.toLowerCase() || 'activity'}. Don't miss out on this exciting event!</p>`,
      `<div class="info-box">
                <div class="info-label">Event</div>
                <div class="info-value">${data.activityTitle}</div>
            </div>`,
      `<div class="info-box">
                <div class="info-label">Date & Time</div>
                <div class="info-value">${formattedDate}</div>
            </div>`,
      data.activityLocation ? `
            <div class="info-box">
                <div class="info-label">Location</div>
                <div class="info-value">${data.activityLocation}</div>
            </div>` : '',
      data.additionalMessage ? `<p>${data.additionalMessage}</p>` : ''
    ].filter(p => p);

    const html = this.generateEmailHtml(
      `New ${data.activityType || 'Activity'} Announced`,
      bodyParagraphs,
      'View Details',
      `${this.frontendUrl}/dashboard/clubs/${data.clubId}`
    );
    
    try {
      await this.mailerService.sendMail(
        data.userEmail,
        `New ${data.activityType || 'Activity'}: ${data.activityTitle} - ${data.clubName}`,
        html
      );
      this.logger.log(`Activity notification sent to ${data.userEmail} for activity ${data.activityTitle}`);
    } catch (error) {
      this.logger.error(`Failed to send activity notification: ${error.message}`);
    }
  }

  /**
   * Send activity reminder to club members
   */
  async sendActivityReminder(data: NotificationData): Promise<void> {
    const formattedDate = data.activityDate 
      ? new Date(data.activityDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'To Be Announced';

    const bodyParagraphs = [
      `<p>This is a friendly reminder about an upcoming ${data.activityType?.toLowerCase() || 'activity'} from <span class="highlight">${data.clubName}</span>.</p>`,
      `<div class="info-box">
                <div class="info-label">Event</div>
                <div class="info-value">${data.activityTitle}</div>
            </div>`,
      `<div class="info-box">
                <div class="info-label">Date & Time</div>
                <div class="info-value">${formattedDate}</div>
            </div>`,
      data.activityLocation ? `
            <div class="info-box">
                <div class="info-label">Location</div>
                <div class="info-value">${data.activityLocation}</div>
            </div>` : '',
      `<p>Make sure to mark your calendar and don't miss it!</p>`
    ].filter(p => p);

    const html = this.generateEmailHtml(
      'Activity Reminder',
      bodyParagraphs,
      'View Details',
      `${this.frontendUrl}/dashboard/clubs/${data.clubId}`
    );
    
    try {
      await this.mailerService.sendMail(
        data.userEmail,
        `Reminder: ${data.activityTitle} - ${data.clubName}`,
        html
      );
      this.logger.log(`Activity reminder sent to ${data.userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send activity reminder: ${error.message}`);
    }
  }

  // ==================== APPROVAL/REJECTION NOTIFICATIONS ====================

  /**
   * Send notification when a role change request is approved/rejected
   */
  async sendApprovalNotification(data: NotificationData): Promise<void> {
    const statusClass = data.status === 'APPROVED' ? 'status-approved' : 'status-rejected';
    const statusText = data.status === 'APPROVED' ? 'Approved' : 'Rejected';
    
    const bodyParagraphs = [
      `<p>Your ${data.requestType || 'request'} has been reviewed by our team.</p>`,
      `<div class="info-box">
                <div class="info-label">Status</div>
                <div class="info-value ${statusClass}">${statusText}</div>
            </div>`,
      data.clubName ? `
            <div class="info-box">
                <div class="info-label">Club</div>
                <div class="info-value">${data.clubName}</div>
            </div>` : '',
      data.additionalMessage ? `
            <div class="info-box">
                <div class="info-label">Reviewer Notes</div>
                <div class="info-value">${data.additionalMessage}</div>
            </div>` : '',
      data.status === 'APPROVED' 
        ? `<p>Congratulations! You now have access to the requested privileges.</p>`
        : `<p>If you have any questions about this decision, please contact the administrators.</p>`
    ].filter(p => p);

    const html = this.generateEmailHtml(
      `Request ${statusText}`,
      bodyParagraphs,
      'Go to Dashboard',
      `${this.frontendUrl}/dashboard`
    );
    
    try {
      console.log(`[NotificationService] Sending approval email to ${data.userEmail} for ${data.requestType}`);
      await this.mailerService.sendMail(
        data.userEmail,
        `Your ${data.requestType || 'Request'} has been ${statusText}`,
        html
      );
      this.logger.log(`Approval notification sent to ${data.userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send approval notification: ${error.message}`);
    }
  }

  /**
   * Send notification for club join request status (for clubs requiring approval)
   */
  async sendJoinRequestNotification(data: NotificationData): Promise<void> {
    let title = '';
    let bodyParagraphs: string[] = [];
    let buttonText = '';
    let buttonUrl = '';
    
    if (data.status === 'PENDING') {
      title = 'Join Request Submitted';
      bodyParagraphs = [
        `<p>Your request to join <span class="highlight">${data.clubName}</span> has been submitted successfully.</p>`,
        `<div class="info-box">
                <div class="info-label">Status</div>
                <div class="info-value status-pending">Pending Review</div>
            </div>`,
        `<p>You will be notified once your request is reviewed by the club administrators.</p>`
      ];
      buttonText = 'View Dashboard';
      buttonUrl = `${this.frontendUrl}/dashboard`;
    } else if (data.status === 'APPROVED') {
      title = `Welcome To ${data.clubName}`;
      bodyParagraphs = [
        `<p>Great news! Your request to join <span class="highlight">${data.clubName}</span> has been approved.</p>`,
        `<div class="info-box">
                <div class="info-label">Status</div>
                <div class="info-value status-approved">Approved</div>
            </div>`,
        `<p>You now have access to all club resources, activities, and events. Welcome to the community!</p>`
      ];
      buttonText = 'View Club';
      buttonUrl = `${this.frontendUrl}/dashboard/clubs/${data.clubId}`;
    } else {
      title = 'Join Request Update';
      bodyParagraphs = [
        `<p>We're sorry to inform you that your request to join <span class="highlight">${data.clubName}</span> has been declined.</p>`,
        `<div class="info-box">
                <div class="info-label">Status</div>
                <div class="info-value status-rejected">Rejected</div>
            </div>`,
        data.reason ? `
            <div class="info-box">
                <div class="info-label">Reason</div>
                <div class="info-value">${data.reason}</div>
            </div>` : '',
        `<p>You can explore other clubs on Geatherlyy that might be a great fit for you.</p>`
      ].filter(p => p);
      buttonText = 'Discover Other Clubs';
      buttonUrl = `${this.frontendUrl}/dashboard/discover`;
    }

    const html = this.generateEmailHtml(title, bodyParagraphs, buttonText, buttonUrl);
    
    try {
      await this.mailerService.sendMail(
        data.userEmail,
        data.status === 'APPROVED' 
          ? `Welcome to ${data.clubName}!`
          : `Join Request Update - ${data.clubName}`,
        html
      );
      this.logger.log(`Join request notification sent to ${data.userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send join request notification: ${error.message}`);
    }
  }

  /**
   * Send coordinator application status notification
   */
  async sendCoordinatorApplicationNotification(data: NotificationData): Promise<void> {
    const statusClass = data.status === 'APPROVED' ? 'status-approved' : 'status-rejected';
    const statusText = data.status === 'APPROVED' ? 'Approved' : 'Rejected';
    
    let bodyParagraphs: string[] = [];
    
    if (data.status === 'APPROVED') {
      bodyParagraphs = [
        `<p>Congratulations! Your application to become a coordinator for <span class="highlight">${data.clubName}</span> has been approved.</p>`,
        `<div class="info-box">
                <div class="info-label">Status</div>
                <div class="info-value ${statusClass}">${statusText}</div>
            </div>`,
        `<p>You now have access to:</p>`,
        `<ul>
                <li>Manage club activities and events</li>
                <li>Access the club management dashboard</li>
                <li>Moderate member activities</li>
                <li>Upload resources and create quizzes</li>
            </ul>`
      ];
    } else {
      bodyParagraphs = [
        `<p>Your application to become a coordinator for <span class="highlight">${data.clubName}</span> has been reviewed.</p>`,
        `<div class="info-box">
                <div class="info-label">Status</div>
                <div class="info-value ${statusClass}">${statusText}</div>
            </div>`,
        data.additionalMessage ? `
            <div class="info-box">
                <div class="info-label">Feedback</div>
                <div class="info-value">${data.additionalMessage}</div>
            </div>` : '',
        `<p>You can continue participating as a club member. Feel free to reapply in the future.</p>`
      ].filter(p => p);
    }

    const html = this.generateEmailHtml(
      `Coordinator Application ${statusText}`,
      bodyParagraphs,
      data.status === 'APPROVED' ? 'Go to Management' : 'View Club',
      data.status === 'APPROVED' 
        ? `${this.frontendUrl}/dashboard/manage` 
        : `${this.frontendUrl}/dashboard/clubs/${data.clubId}`
    );
    
    try {
      await this.mailerService.sendMail(
        data.userEmail,
        `Coordinator Application ${statusText} - ${data.clubName}`,
        html
      );
      this.logger.log(`Coordinator application notification sent to ${data.userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send coordinator application notification: ${error.message}`);
    }
  }

  // ==================== PASSWORD RESET NOTIFICATIONS ====================

  /**
   * Send password reset email with styled template
   */
  async sendPasswordResetEmail(data: {
    userName: string;
    userEmail: string;
    resetUrl: string;
    expiresInHours?: number;
  }): Promise<void> {
    const expiresText = data.expiresInHours ? `${data.expiresInHours} hour${data.expiresInHours > 1 ? 's' : ''}` : '1 hour';

    const bodyParagraphs = [
      `<p>Hi <span class="highlight">${data.userName || 'there'}</span>,</p>`,
      `<p>We received a request to reset the password for your Geatherlyy account associated with this email address.</p>`,
      `<div class="info-box">
                <div class="info-label">Important</div>
                <div class="info-value">This link will expire in ${expiresText}. If you didn't request this password reset, you can safely ignore this email.</div>
            </div>`,
      `<p>Click the button below to create a new password:</p>`
    ];

    const html = this.generatePasswordResetEmailHtml(
      'Reset Your Password',
      bodyParagraphs,
      'Reset Password',
      data.resetUrl
    );
    
    try {
      await this.mailerService.sendMail(
        data.userEmail,
        'Password Reset Request - Geatherlyy',
        html
      );
      this.logger.log(`Password reset email sent to ${data.userEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a specialized email template for password reset
   */
  private generatePasswordResetEmailHtml(title: string, bodyParagraphs: string[], buttonText: string, buttonUrl: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - Geatherlyy</title>
    <style>
        body {
            background-color: #f8f9fa;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }

        .card {
            background: white;
            width: 500px;
            max-width: 100%;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            border-top: 5px solid #dc2626;
            overflow: hidden;
        }

        .content {
            padding: 40px;
        }

        .logo-section {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
        }

        .logo-icon {
            width: 24px;
            height: 24px;
            background-color: #000;
            transform: rotate(45deg);
            margin-right: 10px;
        }

        .brand-name {
            font-size: 22px;
            font-weight: bold;
            color: #1a1a1b;
        }

        .lock-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #dc2626, #ef4444);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
        }

        .lock-icon svg {
            width: 28px;
            height: 28px;
            fill: white;
        }

        h1 {
            font-size: 28px;
            color: #1a1a1b;
            margin-bottom: 20px;
            font-weight: 500;
            text-align: center;
        }

        p {
            color: #5f6368;
            line-height: 1.6;
            font-size: 15px;
            margin-bottom: 20px;
        }

        .highlight {
            font-weight: bold;
            color: #1a1a1b;
        }

        .info-box {
            background-color: #fef2f2;
            border-left: 4px solid #dc2626;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }

        .info-label {
            font-size: 12px;
            text-transform: uppercase;
            color: #dc2626;
            font-weight: 600;
            margin-bottom: 4px;
        }

        .info-value {
            font-size: 14px;
            color: #7f1d1d;
            font-weight: 500;
        }

        .btn-container {
            text-align: center;
            margin: 30px 0;
        }

        .btn {
            background: linear-gradient(135deg, #dc2626, #b91c1c);
            color: white !important;
            border: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            text-decoration: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
        }

        .btn:hover {
            background: linear-gradient(135deg, #b91c1c, #991b1b);
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.5);
        }

        .btn-icon {
            margin-right: 8px;
            font-size: 18px;
        }

        .alternative-link {
            background-color: #f8f9fa;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 20px 0;
            word-break: break-all;
        }

        .alternative-link p {
            margin-bottom: 10px;
            font-size: 13px;
            color: #70757a;
        }

        .alternative-link a {
            color: #dc2626;
            font-size: 12px;
            text-decoration: none;
        }

        .security-notice {
            background-color: #fffbeb;
            border: 1px solid #fbbf24;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }

        .security-notice p {
            margin: 0;
            font-size: 13px;
            color: #92400e;
        }

        .security-notice strong {
            color: #78350f;
        }

        .footer {
            border-top: 1px solid #eee;
            padding: 30px 40px;
            color: #70757a;
            font-size: 14px;
        }

        .footer a {
            color: #dc2626;
            text-decoration: none;
        }

        .signature {
            margin-top: 20px;
            line-height: 1.4;
        }
    </style>
</head>
<body>

    <div class="card">
        <div class="content">
            <div class="logo-section">
                <div class="logo-icon"></div>
                <span class="brand-name">Geatherlyy</span>
            </div>

            <div class="lock-icon">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1C8.676 1 6 3.676 6 7v2H4a1 1 0 00-1 1v11a1 1 0 001 1h16a1 1 0 001-1V10a1 1 0 00-1-1h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v2H8V7c0-2.276 1.724-4 4-4zm0 10a2 2 0 011 3.732V18a1 1 0 11-2 0v-1.268A2 2 0 0112 13z"/>
                </svg>
            </div>

            <h1>${title}</h1>

            ${bodyParagraphs.join('\n            ')}

            <div class="btn-container">
                <a href="${buttonUrl}" class="btn">
                    <span class="btn-icon">🔐</span> ${buttonText}
                </a>
            </div>

            <div class="alternative-link">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <a href="${buttonUrl}">${buttonUrl}</a>
            </div>

            <div class="security-notice">
                <p><strong>🔒 Security Tip:</strong> Never share this link with anyone. Geatherlyy will never ask for your password via email.</p>
            </div>
        </div>

        <div class="footer">
            <div class="disclaimer">
                <p style="font-size: 12px; color: #70757a; margin-bottom: 15px; padding: 12px; background-color: #fef2f2; border-radius: 6px; border-left: 3px solid #dc2626;">
                    <strong>📌 Disclaimer:</strong> This is an automated security notification from Geatherlyy. If you did not request this password reset or have any concerns about your account security, please contact the <strong>Administrator</strong> or your <strong>Faculty Mentor</strong> immediately.
                </p>
            </div>
            Didn't request this? <a href="${this.frontendUrl}/contact">Contact our support team</a>
            <div class="signature">
                Stay secure,<br>
                <strong>~ Geatherlyy Security Team</strong>
            </div>
        </div>
    </div>

</body>
</html>`;
  }

  // ==================== BULK NOTIFICATIONS ====================

  /**
   * Send notification to multiple members
   */
  async sendBulkNotification(
    emails: string[],
    notificationType: 'activity' | 'welcome' | 'removal' | 'approval',
    data: Omit<NotificationData, 'userEmail'>
  ): Promise<void> {
    this.logger.log(`Sending bulk ${notificationType} notifications to ${emails.length} recipients`);
    
    const sendPromises = emails.map(email => {
      const notificationData: NotificationData = { ...data, userEmail: email };
      
      switch (notificationType) {
        case 'activity':
          return this.sendActivityNotification(notificationData);
        case 'welcome':
          return this.sendWelcomeEmail(notificationData);
        case 'removal':
          return this.sendRemovalNotification(notificationData);
        case 'approval':
          return this.sendApprovalNotification(notificationData);
        default:
          return Promise.resolve();
      }
    });

    await Promise.allSettled(sendPromises);
    this.logger.log(`Bulk notification completed for ${notificationType}`);
  }
}
