import { Request, Controller, UseGuards, Get } from "@nestjs/common";
import { UserService } from "./user.service";
import { AuthGuard } from "@nestjs/passport";
import { User } from "./user.entity";

@Controller("user")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get("profile")
  async getProfile(@Request() req: Request & { user: User }) {
    const { email } = req.user;
    return this.userService.findUserByEmail(email);
  }
}
