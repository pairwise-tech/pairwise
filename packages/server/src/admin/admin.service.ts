import { Injectable } from "@nestjs/common";

@Injectable()
export class AdminService {
  public adminIndex() {
    return "Admin Service";
  }
}
