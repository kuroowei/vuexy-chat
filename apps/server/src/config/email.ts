import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Resend's shared test address — works immediately with no domain setup.
// Once a custom domain is verified in the Resend dashboard, replace this
// with something like 'Vuexy Chat <noreply@yourdomain.com>'.
const FROM_ADDRESS = 'Vuexy Chat <onboarding@resend.dev>';

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Reset your Vuexy Chat password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #7c3aed;">Reset your password</h2>
        <p style="color: #374151; font-size: 14px; line-height: 1.6;">
          We received a request to reset your Vuexy Chat password. Click the button below to choose a new one. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 16px 0; padding: 12px 24px; background-color: #7c3aed; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
          Reset Password
        </a>
        <p style="color: #6b7280; font-size: 12px; line-height: 1.6;">
          If you didn't request this, you can safely ignore this email — your password will stay the same.
        </p>
      </div>
    `,
  });
}
