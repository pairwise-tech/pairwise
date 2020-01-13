import { Injectable, BadRequestException } from "@nestjs/common";
import { RequestUser } from "src/types";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "./payments.entity";
import { Repository } from "typeorm";
import { challengeUtilityClass } from "@pairwise/common";
import { ERROR_CODES, SUCCESS_CODES } from "src/tools/constants";

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  async purchaseCourse(requestUser: RequestUser, courseId: string) {
    const { profile, payments } = requestUser;
    console.log(`Purchasing course ${courseId} for user ${profile.email}`);

    if (!challengeUtilityClass.courseIdIsValid(courseId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    }

    const existingCoursePayment = payments.find(p => p.courseId === courseId);
    if (existingCoursePayment) {
      throw new BadRequestException("User has previously paid for this course");
    }

    await this.paymentsRepository.insert({
      courseId,
      user: profile,
      amountPaid: 50,
      type: "SUCCESS",
      datePaid: new Date(),
    });

    return SUCCESS_CODES.OK;
  }
}
