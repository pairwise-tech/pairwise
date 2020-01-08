import { AuthGuard } from "@nestjs/passport";

/**
 * A custom Guard which requires optional authentication. The guard
 * will simply add the user to a request if they are authenticated,
 * but unauthenticated requests will also be passed through.
 *
 * See more here:
 * https://stackoverflow.com/questions/53426069/getting-user-data-by-using-guards-roles-jwt
 */
export class CustomJwtAuthGuard extends AuthGuard("jwt") {
  constructor() {
    super();
  }

  handleRequest(err, user, info) {
    return user || undefined;
  }
}
