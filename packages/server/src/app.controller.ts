import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import * as Sentry from "@sentry/node";

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  public getIndex(): string {
    return this.appService.getIndex();
  }
}
