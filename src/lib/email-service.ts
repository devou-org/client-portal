interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  fromName?: string;
}

interface ServiceRequestEmailData {
  userName: string;
  userEmail: string;
  requestName: string;
  requestDescription: string;
  priority: string;
  submittedAt: Date;
}

export class EmailService {
  static async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        console.error('Failed to send email:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email sending error:', error);
      return false;
    }
  }

  static async sendServiceRequestNotification(data: ServiceRequestEmailData): Promise<boolean> {
    const { userName, userEmail, requestName, requestDescription, priority, submittedAt } = data;
    
    const subject = `New Service Request from ${userName}: ${requestName}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 2px solid #e1e1e1; padding-bottom: 10px;">
          New Service Request Submitted
        </h2>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #555; margin-top: 0;">Request Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Request Name:</td>
              <td style="padding: 8px 0; color: #666;">${requestName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Priority:</td>
              <td style="padding: 8px 0; color: #666;">
                <span style="
                  padding: 4px 8px; 
                  border-radius: 4px; 
                  color: white;
                  background-color: ${priority === 'high' ? '#ef4444' : priority === 'medium' ? '#f59e0b' : '#10b981'};
                ">
                  ${priority.toUpperCase()}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Submitted By:</td>
              <td style="padding: 8px 0; color: #666;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Email:</td>
              <td style="padding: 8px 0; color: #666;">
                <a href="mailto:${userEmail}" style="color: #3b82f6; text-decoration: none;">
                  ${userEmail}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #333;">Submitted At:</td>
              <td style="padding: 8px 0; color: #666;">${submittedAt.toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
          <h4 style="color: #333; margin-top: 0;">Description:</h4>
          <p style="color: #666; line-height: 1.6; margin: 0;">
            ${requestDescription.replace(/\n/g, '<br>')}
          </p>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background-color: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            <strong>Reply Instructions:</strong><br>
            Reply directly to this email to respond to ${userName} at ${userEmail}.
            You can also log into the admin panel to review and manage this request.
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
          <p style="color: #666; margin: 0; font-size: 14px;">
            This email was automatically generated when a new service request was submitted through the Client Portal.
          </p>
        </div>
      </div>
    `;
    
    const text = `
New Service Request from ${userName}

Request Name: ${requestName}
Priority: ${priority.toUpperCase()}
Submitted By: ${userName}
Email: ${userEmail}
Submitted At: ${submittedAt.toLocaleString()}

Description:
${requestDescription}

Reply directly to this email to respond to the user at ${userEmail}.
You can also log into the admin panel to review and manage this request.

This email was automatically generated when a new service request was submitted through the Client Portal.
    `;

    return this.sendEmail({
      to: 'info@devou.in',
      subject,
      html,
      text,
      replyTo: userEmail,
      fromName: userName,
    });
  }
}
