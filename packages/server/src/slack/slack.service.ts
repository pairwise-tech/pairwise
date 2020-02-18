import ENV from "../tools/server-env";
import { WebClient, ErrorCode, WebAPICallResult } from "@slack/web-api";
import { Injectable, Optional } from "@nestjs/common";
import { IFeedbackDto, challengeUtilityClass } from "@pairwise/common";
import { RequestUser } from "src/types";
import { GenericUserProfile } from "src/user/user.service";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */
type SLACK_CHANNELS = "users" | "feedback";

interface SlackFeedbackMessageData {
  feedbackDto: IFeedbackDto;
  user: RequestUser;
  config?: SlackMessageConfig;
}

interface SlackAccountCreationMessageData {
  profile: GenericUserProfile;
  accountCreated: boolean;
  config?: SlackMessageConfig;
}

interface SlackMessageConfig {
  channel: SLACK_CHANNELS;
  mentionAdmins: boolean;
}

/**
 * NOTE: The Slack web-api package does not have full TypeScript support when
 * it comes to result types. As a result, the recommended approach is to
 * extend their base result type and include the properties we need.
 * @see: https://slack.dev/node-slack-sdk/typescript
 */
interface ChatPostMessageResult extends WebAPICallResult {
  channel: string;
  ts: string;
  message: {
    text: string;
  };
}

const defaultFeedbackMessageConfig: SlackMessageConfig = {
  channel: "feedback",
  mentionAdmins: true,
};

const defaultAccountMessageConfig: SlackMessageConfig = {
  channel: "users",
  mentionAdmins: true,
};

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
@Injectable()
export class SlackService {
  constructor(
    @Optional() private client: WebClient,
    @Optional() private adminMentionMarkup: string,
  ) {
    this.client = new WebClient(ENV.SLACK_API_TOKEN);
    this.adminMentionMarkup = ENV.SLACK_ADMIN_IDS.split(",")
      .map(id => `<@${id}>`)
      .join(" ");
  }

  public async postFeedbackMessage({
    feedbackDto,
    user,
    config = defaultFeedbackMessageConfig,
  }: SlackFeedbackMessageData) {
    const message = this.formatFeedbackMessageUtil(feedbackDto, user);
    await this.postMessageToChannel(message, config);
  }

  public async postUserAccountCreationMessage({
    profile,
    accountCreated,
    config = defaultAccountMessageConfig,
  }: SlackAccountCreationMessageData) {
    if (accountCreated) {
      const message = `New account created for *${profile.displayName}* (${profile.email}) :tada:`;
      await this.postMessageToChannel(message, config);
    }
  }

  private async postMessageToChannel(
    message: string,
    config: SlackMessageConfig,
  ) {
    try {
      const { mentionAdmins, channel } = config;
      const text = mentionAdmins
        ? `${this.adminMentionMarkup}\n\n${message}`
        : message;

      // see NOTE
      const result = (await this.client.chat.postMessage({
        text,
        channel,
      })) as ChatPostMessageResult;

      console.log(
        `[SLACK INFO] A message with id ${result.ts} was posed to conversation ${channel}`,
      );
    } catch (e) {
      this.errorLogUtil(e, "Failed to post message to Slack");
    }
  }

  /* Ugly! But pretty in Slack :-) */
  private formatFeedbackMessageUtil(feedback: IFeedbackDto, user: RequestUser) {
    const ctx = challengeUtilityClass.deriveChallengeContextFromId(
      feedback.challengeId,
    );

    // build challenge context string
    const challengeContext =
      "\n*Challenge Context:*" +
      `\n•  *Id:* \`${ctx.challenge.id}\`` +
      `\n•  *Type:* \`${ctx.challenge.type}\`` +
      `\n•  *Course:* ${ctx.course.title}` +
      `\n•  *Module:* ${ctx.module.title}${ctx.module.free ? " _FREE_" : ""}`;

    // wrap feedback with begin/end strings to clearly show user's feedback in slack UI
    const feedbackWrapper = `\n\n*FEEDBACK BEGIN*\n\n${feedback.feedback}\n\n*FEEDBACK END*\n\n`;
    const challengeLink = `<http://127.0.0.1:3000/workspace/${ctx.challenge.id}|*${ctx.challenge.title}*>`;
    let messageBase = `:memo: Feedback for challenge ${challengeLink} of type \`${feedback.type}\``;

    if (user) {
      messageBase += ` submitted by *${user.profile.displayName}* (${user.profile.email}).`;
    } else {
      messageBase += ` was submitted by an unauthenticated user.`;
    }

    return `${messageBase}\n${challengeContext + feedbackWrapper}`;
  }

  private errorLogUtil(error: any, message: string) {
    if (error.code === ErrorCode.PlatformError) {
      console.log(`[SLACK ERROR] ${message}. Error: ${error.data}`);
    } else {
      console.log(`[SLACK ERROR] ${message}. Error Code: ${error.code}`);
      console.log(`[SLACK ERROR] ${JSON.stringify(error)}`);
    }
  }
}
