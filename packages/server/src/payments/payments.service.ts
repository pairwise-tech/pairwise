import { Injectable, BadRequestException } from "@nestjs/common";
import { RequestUser } from "src/types";
import { UserService } from "src/user/user.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Payments } from "./payments.entity";
import { Repository } from "typeorm";
import { challengeUtilityClass } from "@prototype/common";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
  ) {}

  async purchaseCourse(requestUser: RequestUser, courseId: string) {
    const user = await this.userService.findUserByEmail(requestUser.email);
    console.log(`Purchasing course ${courseId} for user ${user.email}`);

    if (!challengeUtilityClass.courseIdIsValid(courseId)) {
      return new BadRequestException("Invalid courseId");
    }

    /**
     * TODO: Check that the user did not already purchase this course,
     * just in case.
     */

    await this.paymentsRepository.insert({
      user,
      courseId,
      datePaid: String(Date.now()),
    });

    return "Success!";
  }
}
