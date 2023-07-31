const request = require("supertest");
const mongoose = require("mongoose");
require("dotenv").config();

const { setupApp } = require("../../src/app");
const { Task, Tasklist, DefaultList } = require("../../src/models/model");
const { describe } = require("node:test");
const TaskList = require("../../src/models/TaskList");

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
    await DefaultList.deleteMany({});
  });

  it("Should create a task with the bare minimum requirements and add it to the default tasklist", async () => {
    await DefaultList.findOneAndUpdate(
      { owner: mockAddress },
      { owner: mockAddress, title: "hello" },
      { upsert: true }
    );
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
    expect(
      await DefaultList.findOne({
        owner: mockAddress,
        tasks: { $size: 1 },
      }).lean()
    ).toBeDefined();

    expect(response.body).toEqual(expectedBody);
  });

  it("Should create a task with the bare minimum requirements and add it to a personal tasklist", async () => {
    const list = await TaskList.findOneAndUpdate(
      { owner: mockAddress },
      { owner: mockAddress, title: "hello", order: 1 },
      { upsert: true, new: true }
    );
    const response = await request(app)
      .post("/task")
      .send({ title: "test title", listId: list._id });

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
    expect(
      await TaskList.findOne({
        owner: mockAddress,
        tasks: { $size: 1 },
      }).lean()
    ).toBeDefined();

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

describe("Tests the get my day tasks endpoint", () => {
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

describe("Tests the mark task endpoint", () => {
  afterEach(async () => {
    await Task.deleteMany({});
    await Tasklist.deleteMany({});
  });

  it("should return status code 400 when request has no body", async () => {
    const response = await request(app).put("/task/mark");

    expect(response.status).toBe(400);
  });

  it("should return status code 400 when request has an invalid taskId (abc...xyz)", async () => {
    const requestBody = { taskId: "abcdefghijklmnopqrstuvwx" };
    const response = await request(app).put("/task/mark").send(requestBody);

    expect(response.status).toBe(400);
  });

  it("should return status code 404 when request has a non-existent taskId (aaa...fff)", async () => {
    const requestBody = { taskId: "aaaabbbbccccddddeeeeffff" };
    const response = await request(app).put("/task/mark").send(requestBody);

    expect(response.status).toBe(404);
  });

  it("should return status code 200 and mark a task as done when request has a valid taskId", async () => {
    const task = new Task({ owner: mockAddress, title: "hello" });
    await task.save();

    const requestBody = { taskId: task._id };
    const response = await request(app).put("/task/mark").send(requestBody);

    const updatedTask = await Task.findById(task._id).lean();
    expect(response.status).toBe(200);
    expect(updatedTask.done).toBe(true);
  });

  it("should return status code 200 and mark a task as not done when request has a valid taskId", async () => {
    const task = new Task({ owner: mockAddress, title: "hello", done: true });
    await task.save();

    const requestBody = { taskId: task._id };
    const response = await request(app).put("/task/mark").send(requestBody);

    const updatedTask = await Task.findById(task._id).lean();
    expect(response.status).toBe(200);
    expect(updatedTask.done).toBe(false);
  });
});
describe("Tests the delete task endpoint", () => {
  afterEach(async () => {
    await Task.deleteMany({});
    await Tasklist.deleteMany({});
  });

  it("Should fail due to no task id being provided", async () => {
    const response = await request(app).delete("/task").send({ listId: "id" });

    expect(response.status).toBe(400);
  });

  it("Should respond with a server error due to crashing query", async () => {
    const response = await request(app).delete("/task").send({ taskId: "id" });

    expect(response.status).toBe(500);
  });

  it("Should respond with a not found error after not finding the task", async () => {
    const response = await request(app)
      .delete("/task")
      .send({ taskId: "aaaabbbbccccddddeeeeffff" });

    expect(response.status).toBe(404);
  });

  it("Should delete a task from the database", async () => {
    const task1 = new Task({ title: "title", owner: mockAddress });
    await task1.save();

    expect(await Task.findOne({ owner: mockAddress }).lean()).toBeDefined();

    const response = await request(app)
      .delete("/task")
      .send({ taskId: task1._id });

    expect(response.status).toBe(204);
    expect(await Task.findOne({ owner: mockAddress }).lean()).toBeNull();
  });

  it("Should delete a task from it's tasklist", async () => {
    const task1 = new Task({ title: "title", owner: mockAddress });
    await task1.save();
    const tasklist1 = new TaskList({
      title: "tasks",
      owner: mockAddress,
      tasks: [task1._id],
      order: 1,
    });
    await tasklist1.save();

    expect(await Task.findOne({ owner: mockAddress }).lean()).toBeDefined();
    expect(
      await Tasklist.findOne({ owner: mockAddress, tasks: { $size: 1 } }).lean()
    ).toBeDefined();

    const response = await request(app)
      .delete("/task")
      .send({ taskId: task1._id });

    expect(response.status).toBe(204);
    expect(await Task.findOne({ owner: mockAddress }).lean()).toBeNull();
    expect(
      await Tasklist.findOne({ owner: mockAddress, tasks: { $size: 0 } }).lean()
    ).toBeDefined();
  });

  it("Should delete a task from the default tasklist", async () => {
    const task1 = new Task({ title: "title", owner: mockAddress });
    await task1.save();
    const tasklist1 = new DefaultList({
      title: "tasks",
      owner: mockAddress,
      tasks: [task1._id],
    });
    await tasklist1.save();

    expect(await Task.findOne({ owner: mockAddress }).lean()).toBeDefined();
    expect(
      await DefaultList.findOne({
        owner: mockAddress,
        tasks: { $size: 1 },
      }).lean()
    ).toBeDefined();

    const response = await request(app)
      .delete("/task")
      .send({ taskId: task1._id });

    expect(response.status).toBe(204);
    expect(await Task.findOne({ owner: mockAddress }).lean()).toBeNull();
    expect(
      await DefaultList.findOne({
        owner: mockAddress,
        tasks: { $size: 0 },
      }).lean()
    ).toBeDefined();
  });
});
