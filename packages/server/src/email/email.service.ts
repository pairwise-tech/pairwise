import nodemailer from "nodemailer";
import ENV from "../tools/server-env";
import { ERROR_CODES } from "src/tools/constants";
import { captureSentryException } from "src/tools/sentry-utils";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

interface EmailRequest {
  text: string;
  subject: string;
  recipient: string;
  html: string;
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
    const privateKey = ENV.GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY.replace(
      new RegExp("\\\\n", "g"),
      "\n",
    );

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: this.emailAddress,
        privateKey,
        serviceClient: ENV.GOOGLE_EMAIL_ACCOUNT_CLIENT_ID,
      },
    });

    this.transporter = transporter;
  }

  public async sendMagicEmailLink(email: string, link: string) {
    console.log("GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY:");
    console.log(ENV.GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY);

    console.log("GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY MODIFIED:");
    const privateKey = ENV.GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY.replace(
      new RegExp("\\\\n", "g"),
      "\n",
    );

    console.log(privateKey);

    const request: EmailRequest = {
      recipient: email,
      subject: "Welcome to Pairwise",
      text: `Hi, welcome to Pairwise! Open this link to get started now: ${link}`,
      html: `Hi, welcome to Pairwise! Click <a href=${link}>this magic link</a> to get started now!`,
    };

    await this.email(request);
  }

  private async email(emailRequest: EmailRequest) {
    const { subject, text, html, recipient } = emailRequest;

    try {
      await this.transporter.verify();
      await this.transporter.sendMail({
        html,
        text,
        subject,
        to: recipient,
        from: this.emailAddress,
      });
    } catch (err) {
      captureSentryException(err);
      console.log("Error sending email: ", err);
      throw new Error(ERROR_CODES.FAILED_TO_SEND_EMAIL);
    }
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export const emailService = new EmailService();
