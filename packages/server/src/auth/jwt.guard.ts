import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";

/**
 * A custom Guard which requires optional authentication. The guard
 * will simply add the user to a request if they are authenticated,
 * but unauthenticated requests will also be passed through.
 */
export class CustomJwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly authService: AuthService) {
    super();
  }

  handleRequest(err, user, info: Error) {
    if (user) {
      return user;
    }

    return undefined;
  }
}
