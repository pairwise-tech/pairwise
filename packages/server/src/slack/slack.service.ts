import ENV from "../tools/server-env";
import { WebClient, ErrorCode, WebAPICallResult } from "@slack/web-api";
import { Injectable, Optional } from "@nestjs/common";
import { IFeedbackDto } from "@pairwise/common";
import { RequestUser } from "src/types";

/**
 * NOTE: The Slack web-api package does not have full TypeScript support when
 * it comes to result types. As a result, the recommended approach is to
 * extend their base result type and include the properties we need.
 * @see: https://slack.dev/node-slack-sdk/typescript
 */
interface ConversationsListResult extends WebAPICallResult {
  channels: Array<{
    name: string;
    id: string;
  }>;
}

interface ChatPostMessageResult extends WebAPICallResult {
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
@Injectable()
export class SlackService {
  constructor(@Optional() private client: WebClient) {
    this.client = new WebClient(ENV.SLACK_API_TOKEN);
  }

  private get adminMentionMarkup() {
    return ENV.SLACK_ADMIN_IDS.split(",")
      .map(id => `<@${id}>`)
      .join(" ");
  }

  public async postMessageToChannel(
    channelName: string,
    message: string,
    mentionAdmins = true,
  ) {
    const channelId = await this.fetchChannelId(channelName);

    if (channelId) {
      try {
        // see NOTE
        const result = (await this.client.chat.postMessage({
          text: `${
            mentionAdmins ? this.adminMentionMarkup + "\n" : ""
          }${message}`,
          channel: channelId,
        })) as ChatPostMessageResult;

        console.log(
          `[SLACK INFO] A message with id ${result.ts} was posed to conversation ${result.channel}`,
        );
      } catch (e) {
        this.errorLogUtil(e, "Failed to post message to Slack");
      }
    }
  }

  private async fetchChannelId(channelName: string) {
    let channelId = "";

    try {
      // see NOTE
      const result = (await this.client.conversations.list()) as ConversationsListResult;
      const channel = result.channels.find(ch => ch.name === channelName);
      channelId = channel.id;
    } catch (e) {
      this.errorLogUtil(e, "Failed to fetch Slack channel id");
    }

    return channelId;
  }

  private errorLogUtil(error: any, message: string) {
    if (error.code === ErrorCode.PlatformError) {
      console.log(`[SLACK ERROR] ${message}. Error: ${error.data}`);
    } else {
      console.log(`[SLACK ERROR] ${message}. Error Code: ${error.code}`);
      console.log(`[SLACK ERROR] ${JSON.stringify(error)}`);
    }
  }

  /* Ugly! But pretty in Slack :-) */
  public formatFeedbackMessageUtil(feedback: IFeedbackDto, user: RequestUser) {
    const challengeInfo = `*${feedback.challengeTitle}* (\`${feedback.challengeId}\`/\`${feedback.challengeType}\`)`;
    const messageBase = `:memo: Feedback for challenge ${challengeInfo} of type \`${feedback.type}\``;
    const feedbackWrapper = `\n\n*FEEDBACK BEGIN*\n\n${feedback.feedback}\n\n*FEEDBACK END*\n\n`;

    if (user) {
      return `${messageBase} submitted by *${user.profile.displayName}* (${user.profile.email}):${feedbackWrapper}`;
    } else {
      return `${messageBase} was submitted by an unauthenticated user:${feedbackWrapper}`;
    }
  }
}
