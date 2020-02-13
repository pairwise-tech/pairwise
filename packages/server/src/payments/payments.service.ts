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
import { contentUtility, CourseMetadata } from "@pairwise/common";

const stripe = new Stripe(ENV.STRIPE_API_KEY, {
  typescript: true,
  apiVersion: "2019-12-03",
});

@Injectable()
export class PaymentsService {
  // Just hard-code it here for now
  COURSE_PRICE = 50;

  constructor(
    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  private async createStripeCheckoutSession(courseMetadata: CourseMetadata) {
    const session = await stripe.checkout.sessions.create({
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
      cancel_url: ENV.STRIPE_CANCEL_URL,
      success_url: `${ENV.STRIPE_SUCCESS_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    });

    return session;
  }

  async handleCreatePaymentIntent(requestUser: RequestUser, courseId: string) {
    const courseMetadata = contentUtility.getCourseMetadata(courseId);
    if (courseMetadata) {
      const session = this.createStripeCheckoutSession(courseMetadata);
      console.log(session);
    } else {
      return new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    }
  }

  async handlePurchaseCourseRequest(
    requestUser: RequestUser,
    courseId: string,
  ) {
    validatePaymentRequest(requestUser, courseId);

    const { profile } = requestUser;
    console.log(`Purchasing course ${courseId} for user ${profile.email}`);

    /**
     * If everything is good create a new payment for this user and course.
     */
    const payment = this.createNewPayment(profile, courseId);
    await this.paymentsRepository.insert(payment);

    return SUCCESS_CODES.OK;
  }

  private createNewPayment = (user: User, courseId: string) => {
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
}
