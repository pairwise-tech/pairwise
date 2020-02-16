import ENV from "../tools/server-env";
import { WebClient, ErrorCode, WebAPICallResult } from "@slack/web-api";
import { Injectable } from "@nestjs/common";
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

@Injectable()
export class SlackService {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(ENV.SLACK_API_TOKEN);
  }

  public async postMessageToChannel(channelName: string, message: string) {
    const channelId = await this.fetchChannelId(channelName);

    if (channelId) {
      try {
        const result = (await this.client.chat.postMessage({
          text: message,
          channel: channelId,
        })) as ChatPostMessageResult;

        console.log(
          `[SLACK INFO] A message with id ${result.ts} was posed to conversation ${result.channel}`,
        );
      } catch (e) {
        this.logSlackError(e, "Failed to post message to Slack");
      }
    }
  }

  private async fetchChannelId(channelName: string) {
    let channelId = "";

    try {
      const result = (await this.client.conversations.list()) as ConversationsListResult;
      const channel = result.channels.find(ch => ch.name === channelName);
      channelId = channel.id;
    } catch (e) {
      this.logSlackError(e, "Failed to fetch Slack channel id");
    }

    return channelId;
  }

  private logSlackError(error: any, message: string) {
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
