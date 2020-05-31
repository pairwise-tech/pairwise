import nodemailer from "nodemailer";
import ENV from "../tools/server-env";
import { ERROR_CODES } from "src/tools/constants";
import { captureSentryException } from "src/tools/sentry-utils";
import {
  getWelcomeEmailContents,
  getMagicEmailLinkContents,
  getVerificationLinkContents,
} from "./templates/index";

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
    // Read it and weep: https://github.com/googleapis/google-api-nodejs-client/issues/1110#issuecomment-546147468
    const GOOGLE_EMAIL_PRIVATE_KEY = ENV.GOOGLE_EMAIL_ACCOUNT_PRIVATE_KEY.replace(
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
        privateKey: GOOGLE_EMAIL_PRIVATE_KEY,
        serviceClient: ENV.GOOGLE_EMAIL_ACCOUNT_CLIENT_ID,
      },
    });

    this.transporter = transporter;
  }

  public async sendMagicEmailLink(email: string, link: string) {
    const request: EmailRequest = {
      recipient: email,
      ...getMagicEmailLinkContents(link),
    };

    await this.email(request);
  }

  public async sendEmailVerificationLink(email: string, link: string) {
    const request: EmailRequest = {
      recipient: email,
      ...getVerificationLinkContents(link),
    };

    await this.email(request);
  }

  public async sendWelcomeEmail(email: string) {
    const request: EmailRequest = {
      recipient: email,
      ...getWelcomeEmailContents(),
    };

    await this.email(request, false);
  }

  private async email(emailRequest: EmailRequest, shouldEscalateError = true) {
    const { subject, text, html, recipient } = emailRequest;

    /**
     * NOTE: In the test/dev environments we create users with faked email
     * addresses. I inadvertently did this and then sent an email verification
     * message to an email which turned out to be a real person. They replied
     * and asked me to remove them from the email list. Oops! So, I am providing
     * this configuration now to make it explicit it we want to enable sending
     * emails. This is set to true in production, of course.
     */
    if (!ENV.ENABLE_EMAILS) {
      console.warn(
        "Emails are disabled - set the ENABLE_EMAILS environment variable to 'true' to enable them.",
      );

      return;
    }

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
      console.log("Error sending email: ", err.message);
      if (shouldEscalateError) {
        throw new Error(ERROR_CODES.FAILED_TO_SEND_EMAIL);
      }
    }
  }
}

/** ===========================================================================
 * Export
 * ============================================================================
 */

export const emailService = new EmailService();
