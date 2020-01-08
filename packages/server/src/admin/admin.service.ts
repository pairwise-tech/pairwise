import { Injectable } from "@nestjs/common";

@Injectable()
export class AdminService {
  adminEndpoint() {
    return "Admin Service";
  }
}
