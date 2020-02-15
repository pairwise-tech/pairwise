import { Request } from "express";
import Stripe from "stripe";
import { Injectable, BadRequestException } from "@nestjs/common";
import { RequestUser } from "src/types";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "./payments.entity";
import { Repository } from "typeorm";
import { SUCCESS_CODES, ERROR_CODES } from "src/tools/constants";
import { User } from "src/user/user.entity";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { validatePaymentRequest } from "src/tools/validation";
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
  // Just hard-code it here for now
  COURSE_PRICE = 50;

  constructor(
    private readonly userService: UserService,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  async handleCreatePaymentIntent(requestUser: RequestUser, courseId: string) {
    const courseMetadata = contentUtility.getCourseMetadata(courseId);
    if (courseMetadata) {
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
        console.log("Failed to create Stripe session!");
        console.log(err);
      }
    } else {
      return new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    }
  }

  async handleStripeCheckoutSuccessWebhook(
    request: Request,
    signature: string,
  ) {
    try {
      // @ts-ignore
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
        await this.handlePurchaseCourseRequest(email, courseId);
      } else {
        // Handle other event types...
      }
    } catch (err) {
      console.log(`[ERROR]: ${err.message}`);
      return new BadRequestException(`Webhook Error: ${err.message}`);
    }

    return SUCCESS_CODES.OK;
  }

  private async handlePurchaseCourseRequest(
    userEmail: string,
    courseId: string,
  ) {
    const user = await this.userService.findUserByEmailGetFullProfile(
      userEmail,
    );

    validatePaymentRequest(user, courseId);

    const { profile } = user;
    console.log(`Purchasing course ${courseId} for user ${profile.email}`);

    /**
     * If everything is good create a new payment for this user and course.
     */
    const payment = this.createNewPayment(profile, courseId);
    await this.paymentsRepository.insert(payment);

    return SUCCESS_CODES.OK;
  }

  private createNewPayment = (user: UserProfile, courseId: string) => {
    /**
     * Construct the new payment data. Once Stripe is integrated, most of this
     * data will come from Stripe and the actual payment information.
     */
    const payment: QueryDeepPartialEntity<Payments> = {
      courseId,
      user,
      amountPaid: 50,
      type: "SUCCESS",
      datePaid: new Date(),
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
          amount: 50,
          currency: "usd",
          name: courseMetadata.title,
          description: courseMetadata.description,
          images: [
            "https://avatars0.githubusercontent.com/u/59724684?s=200&v=4",
          ],
        },
      ],
      cancel_url: `${ENV.CLIENT_URL}/payment-cancelled`,
      success_url: `${ENV.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&courseId=${courseMetadata.id}`,
    });

    return session;
  }
}
