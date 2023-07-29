const request = require("supertest");

const { setupApp } = require("../../src/app");

const mockAddress = "0x1234";

jest.mock("../../src/lib/auth", () => ({
  ...jest.requireActual("../../src/lib/auth"),
  loggedIn(req, res, next) {
    req.user = { address: mockAddress };
    return next();
  },
}));

describe("This is a test call", () => {
  it("Should make a call to the api and bypass the security", async () => {
    const app = await setupApp();
    const server = app.listen(9000);

    const response = await request(app).get("/").expect(200);

    server.close();
  });
});
