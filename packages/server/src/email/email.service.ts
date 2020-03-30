import nodemailer from "nodemailer";
import ENV from "../tools/server-env";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface EmailRequest {
  text: string;
  subject: string;
  recipient: string;
  messageHTML: string;
}

/** ===========================================================================
 * EmailService
 * ----------------------------------------------------------------------------
 * This service handles sending transactional emails to users.
 * ============================================================================
 */
export class EmailService {
  private transporter: any;
  private emailAddress: string = "sean@pairwise.tech";

  constructor() {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: this.emailAddress,
        privateKey: ENV.GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY,
        serviceClient: ENV.GOOGLE_EMAIL_ACCOUNT_CLIENT_ID,
      },
    });

    this.transporter = transporter;
  }

  public async sendMagicEmailLink(email: string, link: string) {
    const request: EmailRequest = {
      recipient: email,
      subject: "Welcome to Pairwise",
      text: `Hi, welcome to Pairwise! Open this link to get started now: ${link}`,
      messageHTML: `Hi, welcome to Pairwise! Click <a href=${link}>this magic link</a> to get started now!`,
    };

    console.log(request);
    await this.email(request);
  }

  private async email(emailRequest: EmailRequest) {
    const { subject, text, messageHTML, recipient } = emailRequest;

    try {
      await this.transporter.verify();
      await this.transporter.sendMail({
        subject,
        text,
        messageHTML,
        to: recipient,
        from: this.emailAddress,
      });
      console.log("Message sent!");
    } catch (err) {
      console.error(err);
    }
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export const emailService = new EmailService();
