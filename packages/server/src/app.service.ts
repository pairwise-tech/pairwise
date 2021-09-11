import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  public getIndex(): string {
    return "This is Pairwise 😎";
  }
}
