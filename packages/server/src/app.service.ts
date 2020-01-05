import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getIndex(): string {
    return "Hello from the Nest Application!";
  }
}
