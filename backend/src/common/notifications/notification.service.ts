import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '../mailer/mailer.service';
import style from 'styled-jsx/style';

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
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; max-width: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 0 30px 0; background-color: #ffffff; border-bottom: 1px solid #e4e4e7;">
                            <img src="cid:logo_cid" alt="Getherlyy" width="50" height="50" style="display: block; border: 0; margin: 0 auto;" />
                            <h2 style="margin: 10px 0 0 0; color: #18181b; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center;">Getherlyy</h2>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 40px; background-color: #ffffff;">
                            <h1 style="margin: 0 0 24px 0; color: #18181b; font-size: 22px; font-weight: 600; text-align: left; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
                            
                            <!-- Body Paragraphs -->
                            <div style="color: #52525b; font-size: 16px; line-height: 1.6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                ${bodyParagraphs.join('\n                                ')}
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="${buttonUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; text-align: center; transition: background-color 0.2s; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                            ${buttonText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
                            <p style="margin: 0 0 16px 0; color: #71717a; font-size: 14px; line-height: 1.5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                <strong>📌 Disclaimer:</strong> This is an automated notification. If you have any issues, please contact your Club Administrator or Faculty Mentor.
                            </p>
                            <p style="margin: 0; color: #a1a1aa; font-size: 13px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                &copy; ${new Date().getFullYear()} Getherlyy. All rights reserved.<br>
                                <a href="${this.frontendUrl}/contact" style="color: #2563eb; text-decoration: none;">Contact Support</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
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
      `<p>If you believe this was done in error, please contact the club administrators or your faculty mentor. You can also explore and join other clubs on Getherlyy.</p>`
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
        `<p>You can explore other clubs on Getherlyy that might be a great fit for you.</p>`
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
      `<p>We received a request to reset the password for your Getherlyy account associated with this email address.</p>`,
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
        'Password Reset Request - Getherlyy',
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
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden; max-width: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                     <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 0 30px 0; background-color: #ffffff; border-bottom: 1px solid #e4e4e7;">
                            <img src="cid:logo_cid" alt="Getherlyy" width="50" height="50" style="display: block; width: 50px; height: 50px; border: 0; margin: 0 auto;" />
                            <h2 style="margin: 10px 0 0 0; color: #18181b; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center;">Getherlyy</h2>
                        </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 40px; background-color: #ffffff;">
                             <div style="text-align: center; margin-bottom: 30px;">
                                <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background-color: #fef2f2; border-radius: 50%;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                </div>
                            </div>
                            
                            <h1 style="margin: 0 0 24px 0; color: #18181b; font-size: 22px; font-weight: 600; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">${title}</h1>
                            
                            <!-- Body Paragraphs -->
                            <div style="color: #52525b; font-size: 16px; line-height: 1.6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                ${bodyParagraphs.join('\n                                ')}
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
                                <tr>
                                    <td align="center">
                                        <a href="${buttonUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #dc2626, #b91c1c); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px; text-align: center; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2); font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                            ${buttonText}
                                        </a>
                                    </td>
                                </tr>
                            </table>
                             <p style="margin: 32px 0 0 0; font-size: 14px; color: #71717a; text-align: center;">
                                If the button above doesn't work, verify that you requested this reset.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #fafafa; border-top: 1px solid #e4e4e7;">
                            <p style="margin: 0; color: #a1a1aa; font-size: 13px; text-align: center; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                                &copy; ${new Date().getFullYear()} Getherlyy. All rights reserved.<br>
                                <a href="${this.frontendUrl}/contact" style="color: #2563eb; text-decoration: none;">Contact Support</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
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