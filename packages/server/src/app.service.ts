import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  public async getIndex() {
    return "This is Pairwise 😎";
  }
}
