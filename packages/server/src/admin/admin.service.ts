import { Injectable } from "@nestjs/common";

@Injectable()
export class AdminService {
  public adminEndpoint() {
    return "Admin Service";
  }
}
