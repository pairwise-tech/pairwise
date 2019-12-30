import request from "supertest";

describe("AppController (e2e)", () => {
  it("/ (GET)", () => {
    return request("http://localhost:9000")
      .get("/")
      .expect(200)
      .expect("Hello World!");
  });
});
