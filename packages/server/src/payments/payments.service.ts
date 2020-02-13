import Stripe from "stripe";
import { Injectable } from "@nestjs/common";
import { RequestUser } from "src/types";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "./payments.entity";
import { Repository } from "typeorm";
import { SUCCESS_CODES } from "src/tools/constants";
import { User } from "src/user/user.entity";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { validatePaymentRequest } from "src/tools/validation";
import ENV from "src/tools/server-env";
import { contentUtility } from "@pairwise/common";

const stripe = new Stripe(ENV.STRIPE_API_KEY, {
  typescript: true,
  apiVersion: "2019-12-03",
});

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  async handleCreatePaymentIntent(requestUser: RequestUser, courseId: string) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          name: "T-shirt",
          description: "Comfortable cotton t-shirt",
          images: ["https://example.com/t-shirt.png"],
          amount: 500,
          currency: "usd",
          quantity: 1,
        },
      ],
      success_url:
        "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://example.com/cancel",
    });
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
