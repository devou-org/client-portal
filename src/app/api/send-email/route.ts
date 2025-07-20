import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, subject, html, text, replyTo, fromName } = body;

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Initialize Resend with the API key
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Construct the from address with optional name
    const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
    const fromAddress = fromName 
      ? `${fromName} via Client Portal <${fromEmail}>`
      : `Client Portal <${fromEmail}>`;

    const emailData: any = {
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    };

    // Add reply-to if provided
    if (replyTo) {
      emailData.replyTo = replyTo;
    }

    const result = await resend.emails.send(emailData);

    if (result.error) {
      console.error('Resend API error:', result.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    console.log('Email sent successfully:', result.data?.id);
    return NextResponse.json({ success: true, id: result.data?.id });
    
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
