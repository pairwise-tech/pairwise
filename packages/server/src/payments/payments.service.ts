import { Request } from "express";
import Stripe from "stripe";
import { Injectable, BadRequestException } from "@nestjs/common";
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
  contentUtility,
  CourseMetadata,
  StripeStartCheckoutSuccessResponse,
  UserProfile,
} from "@pairwise/common";
import { UserService } from "src/user/user.service";

const stripe = new Stripe(ENV.STRIPE_SECRET_KEY, {
  typescript: true,
  apiVersion: "2019-12-03",
});

@Injectable()
export class PaymentsService {
  // Just hard-code these here for now:
  COURSE_PRICE = 5000; // the units are apparently in cents
  COURSE_CURRENCY = "usd";
  PAIRWISE_ICON_URL =
    "https://avatars0.githubusercontent.com/u/59724684?s=200&v=4";

  constructor(
    private readonly userService: UserService,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  // Creates a payment intent using Stripe
  async handleCreatePaymentIntent(requestUser: RequestUser, courseId: string) {
    const courseMetadata = contentUtility.getCourseMetadata(courseId);
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
        console.log("[STRIPE ERROR]: Failed to create Stripe session!");
        console.log(err);
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
      // @ts-ignore - the raw body is added by custom code in main.ts
      const { rawBody } = request;
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        ENV.STRIPE_WEBHOOK_SIGNING_SECRET,
      );

      if (event.type === "checkout.session.completed") {
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
      console.log(`[STRIPE ERROR]: ${err.message}`);
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

    this.paymentsRepository.update(match, payment);

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
    const payment = this.createNewPayment(profile, courseId);
    await this.paymentsRepository.insert(payment);

    return SUCCESS_CODES.OK;
  }

  private createNewPayment = (user: UserProfile, courseId: string) => {
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
    const session = await stripe.checkout.sessions.create({
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
