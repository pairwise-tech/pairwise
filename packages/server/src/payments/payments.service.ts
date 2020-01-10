import { Injectable, BadRequestException } from "@nestjs/common";
import { RequestUser } from "src/types";
import { UserService } from "src/user/user.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "./payments.entity";
import { Repository } from "typeorm";
import { challengeUtilityClass } from "@pairwise/common";
import { ERROR_CODES, SUCCESS_CODES } from "src/tools/constants";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  async purchaseCourse(requestUser: RequestUser, courseId: string) {
    const userResult = await this.userService.findUserByEmailGetFullProfile(
      requestUser.profile.email,
    );
    const { profile: user, payments } = userResult;

    console.log(`Purchasing course ${courseId} for user ${user.email}`);

    if (!challengeUtilityClass.courseIdIsValid(courseId)) {
      throw new BadRequestException(ERROR_CODES.INVALID_COURSE_ID);
    }

    const existingCoursePayment = payments.find(p => p.courseId === courseId);
    if (existingCoursePayment) {
      throw new BadRequestException("User has previously paid for this course");
    }

    await this.paymentsRepository.insert({
      user,
      courseId,
      datePaid: new Date(),
      amountPaid: 50,
    });

    return SUCCESS_CODES.OK;
  }
}
