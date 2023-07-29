const mongoose = require("mongoose");
require("dotenv").config();
const request = require("supertest");

const { setupApp } = require("../../src/app");
const { Tasklist } = require("../../src/models/model");

const mockAddress = "0x1234";

jest.mock("../../src/lib/auth", () => ({
  ...jest.requireActual("../../src/lib/auth"),
  loggedIn(req, res, next) {
    req.user = { address: mockAddress };
    return next();
  },
}));

let app, server;

beforeAll(async () => {
  await mongoose.connect(process.env.DB_TEST_URL);
  app = await setupApp();
  server = app.listen(9000);
});

afterAll(async () => {
  await mongoose.connection.close();
  await server.close();
});

describe("Testing list endpoint creation", () => {
  afterEach(async () => {
    await Tasklist.deleteMany();
  });

  it("It should succeed in creating a list endpoint", async () => {
    const response = await request(app)
      .post("/tasklist")
      .send({ title: "test title" });

    expect(response.status).toBe(200);

    const expectedBody = {
      _id: expect.any(String),
      title: "test title",
      owner: "0x1234",
      order: 1,
      tasks: [],
    };

    expect(await Tasklist.findOne({ owner: "0x1234" }).lean()).toBeDefined();

    expect(response.body).toEqual(expectedBody);
  });

  it("{It should not succeed in creating a list endpoint", async () => {
    const response = await request(app)
      .post("/tasklist")
      .send({ title: "test title", owner: "grr" });

    expect(response.status).toBe(400);
  });
});
