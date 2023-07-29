const request = require("supertest");
const mongoose = require("mongoose");
require("dotenv").config();

const { setupApp } = require("../../src/app");
const { Task, Tasklist } = require("../../src/models/model");
const { describe } = require("node:test");

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

describe("Tests the create task endpoint", () => {
  afterEach(async () => {
    await Task.deleteMany({});
    await Tasklist.deleteMany({});
  });

  it("Should create a task with the bare minimum requirements", async () => {
    const response = await request(app)
      .post("/task")
      .send({ title: "test title" });

    expect(response.status).toBe(200);

    const expectedBody = {
      title: "test title",
      owner: "0x1234",
      done: false,
      important: false,
      myDay: false,
      steps: [],
      _id: expect.any(String),
    };

    expect(await Task.findOne({ owner: "0x1234" }).lean()).toBeDefined();

    expect(response.body).toEqual(expectedBody);
  });

  it("Should fail to create a task due to no title provided", async () => {
    const response = await request(app).post("/task").send();

    expect(response.status).toBe(400);
  });

  it("Should fail to create a task due to nothing being provided", async () => {
    const response = await request(app).post("/task").send();

    expect(response.status).toBe(400);
    expect(await Task.findOne({ owner: "0x1234" }).lean()).toBeNull();
  });

  it("Should fail to create a task due to a bad date being provided", async () => {
    const requestBody = {
      title: "title",
      dueDate: "uhhhhh",
    };

    const response = await request(app).post("/task").send(requestBody);

    expect(response.status).toBe(400);
    expect(await Task.findOne({ owner: "0x1234" }).lean()).toBeNull();
  });

  it("Should fail to create a task due to the repeat amount not being an integer", async () => {
    const requestBody = {
      title: "title",
      dueDate: "2023-10-10",
      repeat: {
        unit: "DAY",
        amount: 3.3,
      },
    };

    const response = await request(app).post("/task").send(requestBody);

    expect(response.status).toBe(400);
    expect(await Task.findOne({ owner: "0x1234" }).lean()).toBeNull();
  });

  it("Should fail to create a task due to the repeat unit not being a valid enum value", async () => {
    const requestBody = {
      title: "title",
      dueDate: "2023-10-10",
      repeat: {
        unit: "DECADES",
        amount: 3,
      },
    };

    const response = await request(app).post("/task").send(requestBody);

    expect(response.status).toBe(400);
    expect(await Task.findOne({ owner: "0x1234" }).lean()).toBeNull();
  });

  it("Should fail to create a task due to the repeat not having all needed information", async () => {
    const requestBody = {
      title: "title",
      dueDate: "2023-10-10",
      repeat: {
        amount: 3,
      },
    };

    const response = await request(app).post("/task").send(requestBody);

    expect(response.status).toBe(400);
    expect(await Task.findOne({ owner: "0x1234" }).lean()).toBeNull();
  });

  it("Should successfully create a task with all possible information", async () => {
    const requestBody = {
      title: "title",
      dueDate: "2023-10-10",
      repeat: {
        unit: "DAY",
        amount: 3,
      },
    };

    const response = await request(app).post("/task").send(requestBody);

    expect(response.status).toBe(200);
    expect(await Task.findOne({ owner: "0x1234" }).lean()).toBeDefined();
  });
});

describe("Tests the get important tasks endpoint", () => {
  afterEach(async () => {
    await Task.deleteMany({});
    await Tasklist.deleteMany({});
  });

  it("Should get all the tasks the user owns marked as important", async () => {
    const task1 = new Task({
      title: "test 1",
      owner: mockAddress,
      important: true,
    });
    const task2 = new Task({
      title: "test 2",
      owner: mockAddress,
      important: true,
    });
    const task3 = new Task({
      title: "test 2",
      owner: "Someone else",
      important: true,
    });
    const task4 = new Task({
      title: "test 2",
      owner: "Someone else",
      important: false,
    });

    await Promise.all([task1.save(), task2.save(), task3.save(), task4.save()]);

    const response = await request(app).get("/task/important").send();

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach((task) => {
      expect(task).toMatchObject({ owner: mockAddress, important: true });
    });
  });
});

describe("Tests the get important tasks endpoint", () => {
  afterEach(async () => {
    await Task.deleteMany({});
    await Tasklist.deleteMany({});
  });

  it("Should get all the tasks the user owns marked as myDay", async () => {
    const task1 = new Task({
      title: "test 1",
      owner: mockAddress,
      myDay: true,
    });
    const task2 = new Task({
      title: "test 2",
      owner: mockAddress,
      myDay: true,
    });
    const task3 = new Task({
      title: "test 2",
      owner: "Someone else",
      myDay: true,
    });
    const task4 = new Task({
      title: "test 2",
      owner: "Someone else",
      myDay: false,
    });

    await Promise.all([task1.save(), task2.save(), task3.save(), task4.save()]);

    const response = await request(app).get("/task/myDay").send();

    expect(response.status).toBe(200);
    expect(response.body.length).toBe(2);
    response.body.forEach((task) => {
      expect(task).toMatchObject({ owner: mockAddress, myDay: true });
    });
  });
});