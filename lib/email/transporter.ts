// lib/email/transporter.ts
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@findyourhomestay.in',
      to,
      subject,
      html,
      text,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

export function bookingConfirmationEmail(
  guestName: string,
  bookingId: string,
  propertyName: string,
  checkIn: string,
  checkOut: string,
  totalAmount: number
) {
  return {
    subject: 'Booking Confirmed - FindYourHomestay',
    html: `
      <h1>Hello ${guestName},</h1>
      <p>Your booking has been confirmed!</p>
      <p><strong>Property:</strong> ${propertyName}</p>
      <p><strong>Check-in:</strong> ${checkIn}</p>
      <p><strong>Check-out:</strong> ${checkOut}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount.toLocaleString()}</p>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p>Thank you for choosing FindYourHomestay.</p>
    `,
  };
}

export function hostNewBookingEmail(
  hostName: string,
  propertyName: string,
  guestName: string,
  bookingId: string,
  checkIn: string,
  checkOut: string
) {
  return {
    subject: 'New Booking Request - FindYourHomestay',
    html: `
      <h1>Hello ${hostName},</h1>
      <p>You have a new booking request for <strong>${propertyName}</strong>.</p>
      <p><strong>Guest:</strong> ${guestName}</p>
      <p><strong>Check-in:</strong> ${checkIn}</p>
      <p><strong>Check-out:</strong> ${checkOut}</p>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p>Please log in to your host dashboard to confirm or manage this booking.</p>
    `,
  };
}

export default transporter;