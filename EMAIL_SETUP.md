# Email Notification Setup Guide

## Overview
The application now sends email notifications to `info@devou.in` whenever a user submits a service request.

## Setup Instructions

### 1. Sign up for Resend
1. Go to [resend.com](https://resend.com)
2. Create an account
3. Get your API key from the dashboard

### 2. Configure Environment Variables
Add the following to your `.env.local` file:

```bash
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com
```

### 3. Domain Verification (Optional but Recommended)
- For production, verify your domain in Resend
- This allows you to send emails from your own domain
- Update `FROM_EMAIL` to use your verified domain

## Features

### Email Notification Content
When a service request is submitted, an email is sent to `info@devou.in` containing:
- Request name and description
- Priority level (with color coding)
- User information (name and email)
- Submission timestamp
- Professional HTML formatting

### User Feedback
- Success toast notification when request is submitted
- Error toast if submission fails
- Visual confirmation of email notification being sent

### Error Handling
- If email sending fails, the service request is still created
- Users are notified of submission success regardless of email status
- Email errors are logged for debugging

## Testing

### Development Testing
1. Ensure environment variables are set
2. Submit a test service request
3. Check console logs for email sending status
4. Verify email receipt at info@devou.in

### Production Deployment
1. Set environment variables in your hosting platform (Vercel)
2. Deploy the application
3. Test with a real service request submission

## Troubleshooting

### Common Issues
1. **Email not sending**: Check RESEND_API_KEY is correctly set
2. **Domain errors**: Use the default FROM_EMAIL until domain is verified
3. **Rate limits**: Resend has rate limits on free accounts

### Logs
Check the application logs for email sending status:
- Success: "Email notification sent successfully"
- Error: "Failed to send email notification: [error details]"

## Cost Considerations
- Resend offers 3,000 free emails per month
- Additional emails are charged per usage
- Monitor usage through the Resend dashboard
