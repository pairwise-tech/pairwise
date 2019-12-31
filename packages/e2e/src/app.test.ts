import request from "supertest";

const HOST = process.env.HOST || "http://localhost:9000";

describe("AppController (e2e)", () => {
  test("/ (GET)", () => {
    return request(HOST)
      .get("/")
      .expect(200)
      .expect("Hello World!");
  });

  test("/auth/facebook (GET)", () => {
    return request(`${HOST}/auth/facebook`)
      .get("/")
      .expect(200)
      .expect(response => {
        console.log(response.body);
        expect(true).toBeTruthy();
      });
  });

  test("/challenges (GET)", () => {
    return request(`${HOST}/challenges`)
      .get("/")
      .expect(200)
      .expect(response => {
        expect(response.body.title).toBe("Fullstack TypeScript");
        expect(Array.isArray(response.body.modules)).toBeTruthy();
      });
  });
});
