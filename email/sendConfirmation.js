import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRegistrationConfirmation({
  email,
  first_name,
  program
}) {
  return resend.emails.send({
    from: "Genesee Swift Track Club <onboarding@resend.dev>", // FREE MODE
    to: email,
    subject: "Registration Confirmed – Genesee Swift Track Club",
    html: `
      <h2>Registration Received</h2>
      <p>Hello ${first_name},</p>

      <p>Thank you for registering for <strong>${program}</strong> with
      <strong>Genesee Swift Track Club</strong>.</p>

      <p>Your registration has been successfully submitted. A coach or staff
      member will follow up with next steps.</p>

      <p>If you have questions, please reply to this email.</p>

      <br />
      <p>— Genesee Swift Track Club</p>
    `
  });
}
