import { Injectable } from "@nestjs/common";
import { RequestUser } from "src/types";
import { UserService } from "src/user/user.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly userService: UserService) {}

  async purchaseCourse(requestUser: RequestUser, courseId: string) {
    const user = await this.userService.findUserByEmail(requestUser.email);
    console.log(`Purchasing course ${courseId} for user ${user.email}`);
  }
}
