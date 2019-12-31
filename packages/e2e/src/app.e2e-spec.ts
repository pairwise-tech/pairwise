import request from "supertest";

describe("AppController (e2e)", () => {
  it("/ (GET)", () => {
    return request("http://server:9000")
      .get("/")
      .expect(200)
      .expect("Hello World!");
  });

  it("/ (GET)", () => {
    return request("http://server:9000/challenges")
      .get("/")
      .expect(200)
      .expect(response => {
        response.body = [];
      });
  });
});
