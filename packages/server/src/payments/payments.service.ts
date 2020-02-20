import { Request } from "express";
import Stripe from "stripe";
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { RequestUser } from "src/types";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "./payments.entity";
import { Repository } from "typeorm";
import { SUCCESS_CODES, ERROR_CODES } from "src/tools/constants";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import {
  validatePaymentRequest,
  validateRefundRequest,
} from "src/tools/validation";
import ENV from "src/tools/server-env";
import {
  StripeStartCheckoutSuccessResponse,
  UserProfile,
  ContentUtility,
  CourseMetadata,
} from "@pairwise/common";
import { UserService } from "src/user/user.service";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

enum StripeEventTypes {
  CHECKOUT_COMPLETED = "checkout.session.completed",
}

const PRICING_CONSTANTS = {
  COURSE_PRICE: 5000, // the units are apparently in cents
  ACCEPTED_CURRENCY: "usd",
};

const PairwiseIconUrl =
  "https://avatars0.githubusercontent.com/u/59724684?s=200&v=4";

/** ===========================================================================
 * Payments Service
 * ============================================================================
 */

@Injectable()
export class PaymentsService {
  stripe: Stripe;

  COURSE_PRICE: number;
  COURSE_CURRENCY: string;
  PAIRWISE_ICON_URL: string;

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

    // Set pricing values
    this.COURSE_PRICE = PRICING_CONSTANTS.COURSE_PRICE;
    this.COURSE_CURRENCY = PRICING_CONSTANTS.ACCEPTED_CURRENCY;
    this.PAIRWISE_ICON_URL = PairwiseIconUrl;
  }

  // Creates a payment intent using Stripe
  async handleCreatePaymentIntent(requestUser: RequestUser, courseId: string) {
    const courseMetadata = ContentUtility.getCourseMetadata(courseId);
    if (!courseMetadata) {
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    } else {
      try {
        const session = await this.createStripeCheckoutSession(
          requestUser,
          courseMetadata,
        );

        const result: StripeStartCheckoutSuccessResponse = {
          stripeCheckoutSessionId: session.id,
        };

        return result;
      } catch (err) {
        // I saw this happen once. If it happens more, we could create retry
        // logic here...
        console.log("[STRIPE ERROR]: Failed to create Stripe session!", err);
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
  async handleStripeCheckoutSuccessWebhook(
    request: Request,
    signature: string,
  ) {
    try {
      // You must use the raw body:
      // @ts-ignore - the raw body is added by custom code in main.ts
      const { rawBody } = request;
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        ENV.STRIPE_WEBHOOK_SIGNING_SECRET,
      );

      if (event.type === StripeEventTypes.CHECKOUT_COMPLETED) {
        const { object } = event.data as any; /* Stripe type is pointless */
        const email = object.customer_email;
        const courseId = object.metadata.courseId;
        console.log(
          `[STRIPE]: Checkout session completed event received for user: ${email} and course: ${courseId}`,
        );
        await this.handlePurchaseCourseRequest(email, courseId);
      } else {
        // Handle other event types...
      }
    } catch (err) {
      console.log(`[STRIPE WEBHOOK ERROR]: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    return SUCCESS_CODES.OK;
  }

  async handlePurchaseCourseByAdmin(userEmail: string, courseId: string) {
    console.log(
      `[ADMIN]: Admin request to purchase course: ${courseId} for user: ${userEmail}`,
    );
    return this.handlePurchaseCourseRequest(userEmail, courseId);
  }

  async handleRefundCourseByAdmin(userEmail: string, courseId: string) {
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

  private async handlePurchaseCourseRequest(
    userEmail: string,
    courseId: string,
  ) {
    const user = await this.userService.findUserByEmailGetFullProfile(
      userEmail,
    );

    // Will throw error if invalid
    validatePaymentRequest(user, courseId);

    const { profile } = user;
    console.log(`Purchasing course ${courseId} for user ${profile.email}`);

    // If everything is good create a new payment for this user and course.
    const payment = this.createNewPaymentObject(profile, courseId);
    await this.paymentsRepository.insert(payment);

    return SUCCESS_CODES.OK;
  }

  private createNewPaymentObject = (user: UserProfile, courseId: string) => {
    // Construct the new payment data. Once Stripe is integrated, most of this
    // data will come from Stripe and the actual payment information.
    const payment: QueryDeepPartialEntity<Payments> = {
      user,
      courseId,
      status: "CONFIRMED",
      datePaid: new Date(),
      amountPaid: this.COURSE_PRICE,
    };

    return payment;
  };

  private async createStripeCheckoutSession(
    requestUser: RequestUser,
    courseMetadata: CourseMetadata,
  ) {
    // Create a new checkout session with Stripe
    const session = await this.stripe.checkout.sessions.create({
      customer_email: requestUser.profile.email,
      metadata: {
        courseId: courseMetadata.id,
      },
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          amount: this.COURSE_PRICE,
          currency: this.COURSE_CURRENCY,
          name: courseMetadata.title,
          description: courseMetadata.description,
          images: [this.PAIRWISE_ICON_URL],
        },
      ],
      cancel_url: `${ENV.CLIENT_URL}/payment-cancelled`,
      success_url: `${ENV.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&courseId=${courseMetadata.id}`,
    });

    return session;
  }
}
