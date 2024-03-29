import { Request } from "express";
import Stripe from "stripe";
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { RequestUser } from "../types";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "./payments.entity";
import { Repository } from "typeorm";
import { SUCCESS_CODES, ERROR_CODES } from "../tools/constants";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import {
  validatePaymentPlan,
  validatePaymentRequest,
  validateRefundRequest,
} from "../tools/validation-utils";
import ENV from "../tools/server-env";
import {
  Payment,
  StripeStartCheckoutSuccessResponse,
  UserProfile,
  ContentUtility,
  CourseMetadata,
  PAYMENT_PLAN,
  AdminPurchaseCourseDto,
} from "@pairwise/common";
import { UserService } from "../user/user.service";
import { captureSentryException } from "../tools/sentry-utils";
import { slackService, SlackService } from "../slack/slack.service";
import { emailService, EmailService } from "../email/email.service";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

enum StripeEventTypes {
  CHECKOUT_COMPLETED = "checkout.session.completed",
}

// The pricing units are apparently in cents, 5000 = $50 USD.
const PRICING_CONSTANTS = {
  ACCEPTED_CURRENCY: "usd",
};

interface PurchaseCourseRequest extends AdminPurchaseCourseDto {
  isGift?: boolean;
}

interface CheckoutMetadata {
  plan: PAYMENT_PLAN;
  courseId: string;
}

interface StripeCheckoutObjectData {
  customer_email: string;
  metadata: CheckoutMetadata;
}

/** ===========================================================================
 * Payments Service
 * ============================================================================
 */

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly slackService: SlackService;
  private readonly emailService: EmailService;

  private COURSE_CURRENCY: string;
  private PAIRWISE_ICON_URL: string;

  constructor(
    private readonly userService: UserService,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {
    // Initialize Stripe module
    const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
      typescript: true,
      apiVersion: "2019-12-03",
    });

    this.stripe = stripe;
    this.slackService = slackService;
    this.emailService = emailService;

    this.PAIRWISE_ICON_URL = ENV.PAIRWISE_CHECKOUT_ICON;
    this.COURSE_CURRENCY = PRICING_CONSTANTS.ACCEPTED_CURRENCY;
  }

  // Retrieve all the existing payment records
  public async fetchAllPaymentRecords() {
    return this.paymentsRepository.find();
  }

  // Creates a payment intent using Stripe
  public async handleCreatePaymentIntent(
    requestUser: RequestUser,
    courseId: string,
    plan: PAYMENT_PLAN,
  ) {
    console.log(
      `[STRIPE]: Running handleCreatePaymentIntent for user: ${requestUser.profile.uuid}, courseId: ${courseId}, plan: ${plan}`,
    );

    // Validate the payment plan
    validatePaymentPlan(plan);

    const courseMetadata = ContentUtility.getCourseMetadata(courseId);
    if (!courseMetadata) {
      const err = new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
      captureSentryException(`Invalid courseId, received: ${courseId}`);
      throw err;
    } else {
      try {
        const session = await this.createStripeCheckoutSession(
          requestUser,
          courseMetadata,
          plan,
        );

        const result: StripeStartCheckoutSuccessResponse = {
          stripeCheckoutSessionId: session.id,
        };

        return result;
      } catch (error) {
        // I saw this happen once. If it happens more, we could create retry
        // logic here or debug the issue.
        captureSentryException(error);
        throw new InternalServerErrorException(
          "Failed to initialize checkout session",
        );
      }
    }
  }

  // Processes a successfully checkout event sent to us via a webhook
  // from Stripe. This occurs after a user completes checkout in the
  // Stripe UI. Based on the event information, we create a payment for
  // user and course.
  public async handleStripeCheckoutSuccessWebhook(
    request: Request,
    signature: string,
  ) {
    try {
      console.log(`[STRIPE]: Running handleStripeCheckoutSuccessWebhook`);
      // You must use the raw body:
      // eslint-disable-next-line
      // @ts-ignore - the raw body is added by custom code in main.ts
      const { rawBody } = request;
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        ENV.STRIPE_WEBHOOK_SIGNING_SECRET,
      );

      if (event.type === StripeEventTypes.CHECKOUT_COMPLETED) {
        // Stripe type is pointless
        const object = event.data.object as unknown as StripeCheckoutObjectData;

        const email = object.customer_email;
        const plan = object.metadata.plan;
        const courseId = object.metadata.courseId;

        console.log(
          `[STRIPE]: Checkout session completed event received for user: ${email} and course: ${courseId}`,
        );
        await this.handlePurchaseCourseRequest({
          plan,
          courseId,
          userEmail: email,
        });

        // Post message to Slack
        this.slackService.postCoursePurchaseMessage(email, plan);

        // Send payment confirmation email to the user
        this.emailService.sendPaymentConfirmationEmail(email);

        return SUCCESS_CODES.OK;
      } else {
        // Handle other event types...
        captureSentryException(
          `Unexpected event type in Stripe checkout flow: ${event.type}`,
        );
      }
    } catch (error) {
      captureSentryException(error);
      throw error;
    }
  }

  public async handlePurchaseCourseByAdmin(payload: AdminPurchaseCourseDto) {
    const { userEmail, courseId } = payload;
    console.log(
      `[ADMIN]: Admin request to purchase course: ${courseId} for user: ${userEmail}`,
    );
    return this.handlePurchaseCourseRequest({
      ...payload,
      isGift: true,
    });
  }

  public async handleRefundCourseByAdmin(userEmail: string, courseId: string) {
    console.log(
      `[ADMIN]: Admin request to refund course: ${courseId} for user: ${userEmail}`,
    );

    const user = await this.userService.findUserByEmailGetFullProfile(
      userEmail,
    );

    // Will throw error if invalid
    validateRefundRequest(user, courseId);

    const { profile } = user;
    console.log(`Refunding course ${courseId} for user ${profile.email}`);

    const match = {
      courseId,
      user: profile,
    };

    const payment: QueryDeepPartialEntity<Payments> = {
      status: "REFUNDED",
    };

    await this.paymentsRepository.update(match, payment);

    return SUCCESS_CODES.OK;
  }

  private async handlePurchaseCourseRequest(args: PurchaseCourseRequest) {
    const { userEmail, courseId, plan } = args;
    const user = await this.userService.findUserByEmailGetFullProfile(
      userEmail,
    );

    // Will throw error if invalid
    validatePaymentRequest(user, courseId, plan);

    const { profile } = user;
    console.log(`Purchasing course ${courseId} for user ${profile.email}`);

    // If everything is good create a new payment for this user and course.
    const payment = this.createNewPaymentObject(profile, args);
    await this.paymentsRepository.insert(payment);

    /**
     * NOTE: Currently course payments are granted a free coaching session.
     *
     * Premium plan purchases receive 3 coaching sessions.
     */
    const sessions = plan === "PREMIUM" ? 3 : 1;
    await this.userService.grantCoachingSessionToUser(profile.uuid, sessions);

    return SUCCESS_CODES.OK;
  }

  private createNewPaymentObject = (
    user: UserProfile,
    args: PurchaseCourseRequest,
  ) => {
    const { plan, courseId, isGift = false } = args;

    // Get the metadata for this course
    const courseMetadata = ContentUtility.getCourseMetadata(courseId);

    const IS_PREMIUM = plan === "PREMIUM";
    const price = IS_PREMIUM
      ? courseMetadata.premiumPrice
      : courseMetadata.price;

    // Construct the new payment data. Once Stripe is integrated, most of this
    // data will come from Stripe and the actual payment information.
    const payment: Payment = {
      plan,
      courseId,
      status: "CONFIRMED",
      datePaid: new Date(),
      amountPaid: price,
      paymentType: isGift ? "ADMIN_GIFT" : "USER_PAID",
    };

    const paymentPartial: QueryDeepPartialEntity<Payments> = {
      user,
      ...payment,
    };

    return paymentPartial;
  };

  private async createStripeCheckoutSession(
    requestUser: RequestUser,
    courseMetadata: CourseMetadata,
    plan: PAYMENT_PLAN,
  ) {
    const userEmail = requestUser.profile.email;

    if (!userEmail) {
      // Should not happen, but check just in case.
      throw new BadRequestException(ERROR_CODES.MISSING_EMAIL);
    }

    const IS_PREMIUM = plan === "PREMIUM";
    const price = IS_PREMIUM
      ? courseMetadata.premiumPrice
      : courseMetadata.price;
    const title = IS_PREMIUM
      ? `${courseMetadata.title} (PREMIUM)`
      : courseMetadata.title;

    const metadata: Stripe.MetadataParam = {
      plan,
      courseId: courseMetadata.id,
    };

    const descriptionSuffix =
      "The premium course includes the following: Three one hour coaching sessions throughout the curriculum, access to our premium Pairwise Slack/Discord community, 1:1 support throughout the curriculum, and personalized code/project review.";

    const description = IS_PREMIUM
      ? `${courseMetadata.description} ${descriptionSuffix}`
      : courseMetadata.description;

    // Create a new checkout session with Stripe
    const session = await this.stripe.checkout.sessions.create({
      customer_email: userEmail,
      metadata,
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          name: title,
          description,
          amount: price,
          currency: this.COURSE_CURRENCY,
          images: [this.PAIRWISE_ICON_URL],
        },
      ],
      cancel_url: `${ENV.CLIENT_URL}/payment-cancelled`,
      success_url: `${ENV.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&courseId=${courseMetadata.id}`,
    });

    return session;
  }

  public handlePaymentCancelledEvent = (requestUser: RequestUser) => {
    this.slackService.postPurchaseCancelledMessage(requestUser.profile.email);
  };
}
