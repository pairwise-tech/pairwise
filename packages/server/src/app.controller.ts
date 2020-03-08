import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import * as Sentry from "@sentry/node";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/error")
  testError() {
    try {
      console.log("Sentry capture message");
      Sentry.captureMessage("This is a message!");
      throw new Error("Pairwise blew up!");
    } catch (err) {
      console.log("Sentry capture error");
      Sentry.captureException(err);
    }

    return "Started fires! 🔥";
  }

  @Get()
  getIndex(): string {
    return this.appService.getIndex();
  }
}
