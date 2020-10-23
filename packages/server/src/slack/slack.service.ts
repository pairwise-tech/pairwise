import ENV from "../tools/server-env";
import { WebClient, ErrorCode, WebAPICallResult } from "@slack/web-api";
import {
  IFeedbackDto,
  ContentUtility,
  IGenericFeedback,
} from "@pairwise/common";
import { RequestUser } from "../types";
import { GenericUserProfile } from "../user/user.service";
import { captureSentryException } from "../tools/sentry-utils";
import { ADMIN_URLS, HTTP_METHOD } from "../admin/admin.controller";
import { SigninStrategy } from "../auth/auth.service";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */
type SLACK_CHANNELS = "feedback" | "production";

interface SlackFeedbackMessageData {
  feedbackDto: IFeedbackDto;
  user?: RequestUser;
  config?: SlackMessageConfig;
}

interface SlackGenericFeedbackMessageData {
  feedbackDto: IGenericFeedback;
  user?: RequestUser;
  config?: SlackMessageConfig;
}

interface SlackAccountCreationMessageData {
  profile: GenericUserProfile;
  accountCreated: boolean;
  signinStrategy: SigninStrategy;
  config?: SlackMessageConfig;
}

interface SlackAdminMessageData {
  requestPath: ADMIN_URLS;
  httpMethod: HTTP_METHOD;
  adminUserEmail: string;
  config?: SlackMessageConfig;
}

interface SlackAdminErrorMessageData {
  error: string;
}

interface SlackMessageConfig {
  channel?: SLACK_CHANNELS;
  mentionAdmins?: boolean;
}

/**
 * NOTE: The Slack web-api package does not have full TypeScript support when
 * it comes to result types. As a result, the recommended approach is to
 * extend their base result type and include the properties we need.
 * @see: https://slack.dev/node-slack-sdk/typescript
 */
interface ChatPostMessageResult extends WebAPICallResult {
  ok: boolean;
  error?: string;
  channel: string;
  ts: string;
  message: {
    text: string;
  };
}

/** ===========================================================================
 * SlackService
 * ----------------------------------------------------------------------------
 * This class acts as a wrapper around Slack's web-api client to streamline
 * the few tasks we need to accomplish. It also provides helper methods for
 * formatting the messages we send to slack and keeps ugly formatting code out
 * of our business logic. Using Nest's DI system, we can inject this into any
 * of our server modules wherever it's needed.
 * ============================================================================
 */
export class SlackService {
  private client: WebClient;
  private adminMentionMarkup: string;

  constructor() {
    this.client = new WebClient(ENV.SLACK_API_TOKEN);
    this.adminMentionMarkup = ENV.SLACK_ADMIN_IDS.map(id => `<@${id}>`).join(
      " ",
    );
  }

  public async postCoursePurchaseMessage() {
    const fire = ":fire: :fire: :fire:";
    const message = `${fire} *Someone purchased a course!!!* ${fire}`;
    await this.postMessageToChannel(message, { channel: "production" });
  }

  public async postAdminActionAwarenessMessage({
    httpMethod,
    requestPath,
    adminUserEmail,
    config,
  }: SlackAdminMessageData) {
    const alert = `:sunglasses: Action taken by Admin User: \`${adminUserEmail}\`. Requested admin API: *[${httpMethod}]:* \`${requestPath}\`.`;
    await this.postMessageToChannel(alert, {
      channel: "production",
      ...config,
    });
  }

  public async postFeedbackMessage({
    feedbackDto,
    user,
    config,
  }: SlackFeedbackMessageData) {
    const message = this.formatFeedbackMessageUtil(feedbackDto, user);
    await this.postMessageToChannel(message, {
      channel: "feedback",
      ...config,
    });
  }

  public async postGenericFeedbackMessage({
    feedbackDto,
    user,
    config,
  }: SlackGenericFeedbackMessageData) {
    const email = user?.profile?.email;
    const uuid = user?.profile?.email;

    const context = feedbackDto.context
      ? feedbackDto.context
      : "no context provided.";

    const userString = email
      ? `*${email}*`
      : user
      ? `*a user with no email* (uuid: \`${uuid}\`)`
      : "*an unregistered user*";

    const message =
      `:envelope_with_arrow: New message received from ${userString}, (context: \`${context}\`):` +
      `\n\n \`\`\`${feedbackDto.message}\`\`\``;

    await this.postMessageToChannel(message, {
      channel: "feedback",
      ...config,
    });
  }

  public async postUserAccountCreationMessage({
    profile,
    accountCreated,
    signinStrategy,
    config,
  }: SlackAccountCreationMessageData) {
    if (accountCreated) {
      const name = profile.displayName;
      const nameSnippet = name ? ` for *${profile.displayName}* ` : " ";
      const message = `New account created${nameSnippet}using ${signinStrategy} strategy :tada:`;
      await this.postMessageToChannel(message, {
        channel: "production",
        ...config,
      });
    }
  }

  public async postAdminErrorMessage({ error }: SlackAdminErrorMessageData) {
    const message = `An error occurred with an admin API request, here's what we know: ${error}`;
    await this.postMessageToChannel(message, { channel: "production" });
  }

  private async postMessageToChannel(
    message: string,
    config: SlackMessageConfig,
  ) {
    try {
      const { mentionAdmins = false, channel } = config;

      const text =
        mentionAdmins && this.adminMentionMarkup
          ? `${this.adminMentionMarkup}\n${message}`
          : message;

      // see NOTE
      const result = (await this.client.chat.postMessage({
        text,
        channel,
      })) as ChatPostMessageResult;

      if (result.ok) {
        console.log(
          `[SLACK INFO]: A message with id ${result.ts} was posed to conversation ${channel}`,
        );
      } else {
        console.log(`[SLACK ERROR]: ${result.error}`);
      }
    } catch (e) {
      this.errorLogUtil(e, "Failed to post message to Slack");
    }
  }

  /* Ugly! But pretty in Slack :-) */
  private formatFeedbackMessageUtil(feedback: IFeedbackDto, user: RequestUser) {
    const ctx = ContentUtility.deriveChallengeContextFromId(
      feedback.challengeId,
    );

    // build challenge context string
    const challengeContext =
      "\n*Challenge Context:*" +
      `\n•  *Id:* \`${ctx.challenge.id}\`` +
      `\n•  *Type:* \`${ctx.challenge.type}\`` +
      `\n•  *Course:* ${ctx.course.title}` +
      `\n•  *Module:* ${ctx.module.title}${ctx.module.free ? " _FREE_" : ""}`;

    // build challenge link strings
    const prodLink = `<https://app.pairwise.tech/workspace/${ctx.challenge.id}|prod>`;
    const localLink = `<http://127.0.0.1:3000/workspace/${ctx.challenge.id}|local>`;
    const challengeLinks = `*${ctx.challenge.title}* (${prodLink}/${localLink})`;

    // wrap feedback with begin/end strings to clearly show user's feedback in slack UI
    const feedbackWrapper = `\n\n*FEEDBACK BEGIN*\n\n${feedback.feedback}\n\n*FEEDBACK END*\n\n`;

    // build base message
    let messageBase = `:memo: Feedback for challenge ${challengeLinks} of type \`${feedback.type}\``;

    if (user) {
      messageBase += ` submitted by *${user.profile.displayName}* (${user.profile.email}).`;
    } else {
      messageBase += ` was submitted by an anonymous user.`;
    }

    return `${messageBase}\n${challengeContext + feedbackWrapper}`;
  }

  private errorLogUtil(error: any, message: string) {
    if (error.code === ErrorCode.PlatformError) {
      console.log(`[SLACK ERROR]: ${message}. Error: ${error.message}`);
    } else {
      captureSentryException(error);
    }
  }
}

export const slackService = new SlackService();
