const mongoose = require("mongoose");
require("dotenv").config();
const request = require("supertest");

const { setupApp } = require("../../src/app");
const { Tasklist, Task } = require("../../src/models/model");

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

  it("It should not succeed in creating a list endpoint", async () => {
    const response = await request(app)
      .post("/tasklist")
      .send({ title: "test title", owner: "grr" });

    expect(response.status).toBe(400);
  });

  describe("Testing list endpoint deletion", () => {
    afterEach(async () => {
      await Tasklist.deleteMany();
    });

    it("It should succeed in creating a list endpoint and deleting it", async () => {
      const taskList1 = new Tasklist({
        title: "test title",
        owner: mockAddress,
        order: 1,
        tasks: [],
      });
      await taskList1.save();

      expect(
        await Tasklist.findOne({ owner: mockAddress }).lean()
      ).toBeDefined();

      const removeResponse = await request(app)
        .delete("/tasklist/remove")
        .send({ tasklistId: taskList1._id.toString() });

      expect(removeResponse.status).toBe(200);
    });

    it("It should fail in deleting endpoint list due to no list existing", async () => {
      const removeResponse = await request(app)
        .delete("/tasklist/remove")
        .send({ tasklistId: "aaaabbbbccccddddeeeeffff" });

      expect(removeResponse.status).toBe(400);
    });

    it("It should fail due to poor body request", async () => {
      const removeResponse = await request(app)
        .delete("/tasklist/remove")
        .send({ tasklistId: "grrr" });

      expect(removeResponse.status).toBe(401);
    });
    it("create a new task, delete the list, tasks should be deleted too", async () => {
      const task1 = new Task({ title: "title", owner: mockAddress });
      await task1.save();
      const tasklist1 = new Tasklist({
        title: "tasks",
        owner: mockAddress,
        tasks: [task1._id],
        order: 1,
      });
      await tasklist1.save();

      expect(await Task.findOne({ owner: mockAddress }).lean()).toBeDefined();
      expect(
        await Tasklist.findOne({
          owner: mockAddress,
          tasks: { $size: 1 },
        }).lean()
      ).toBeDefined();

      const removeResponse = await request(app)
        .delete("/tasklist/remove")
        .send({ tasklistId: tasklist1._id.toString() });

      expect(removeResponse.status).toBe(200);
      expect(await Task.findOne({ owner: mockAddress }).lean()).toBeNull();
      expect(await Tasklist.findOne({ owner: mockAddress }).lean()).toBeNull();
    });

    it("creates multiple new tasks, delete the list, all tasks should be deleted too", async () => {
      const task1 = new Task({ title: "title1", owner: mockAddress });
      const task2 = new Task({ title: "title2", owner: mockAddress });
      await task1.save();
      await task2.save();
      const tasklist1 = new Tasklist({
        title: "tasks",
        owner: mockAddress,
        tasks: [task1._id, task2._id],
        order: 1,
      });
      await tasklist1.save();

      expect(await Task.findOne({ owner: mockAddress }).lean()).toBeDefined();
      expect(
        await Tasklist.findOne({
          owner: mockAddress,
          tasks: { $size: 1 },
        }).lean()
      ).toBeDefined();

      const removeResponse = await request(app)
        .delete("/tasklist/remove")
        .send({ tasklistId: tasklist1._id.toString() });

      expect(removeResponse.status).toBe(200);
      expect(await Task.findOne({ owner: mockAddress }).lean()).toBeNull();
      expect(await Tasklist.findOne({ owner: mockAddress }).lean()).toBeNull();
    });
  });

  describe("Testing list endpoint updating title", () => {
    afterEach(async () => {
      await Tasklist.deleteMany();
    });

    it("Should return a 400 format error status code on each test", async () => {
      const updateResponse1 = await request(app)
        .put("/tasklist/title")
        .send({ tasklistId: "SUU", newTitle: "test title" });
      const updateResponse2 = await request(app)
        .put("/tasklist/title")
        .send({ newTitle: "test title" });
      const updateResponse3 = await request(app)
        .put("/tasklist/title")
        .send({ tasklistId: "aaaabbbbccccddddeeeeffff" });

      expect(updateResponse1.status).toBe(400);
      expect(updateResponse2.status).toBe(400);
      expect(updateResponse3.status).toBe(400);
    });

    it("Should send a 404 for no tasklist found to update", async () => {
      const updateResponse = await request(app).put("/tasklist/title").send({
        tasklistId: "aaaabbbbccccddddeeeeffff",
        newTitle: "test title2",
      });

      expect(updateResponse.status).toBe(404);
    });
  });

  it("Should update the tasklist title and return 200 status code", async () => {
    const testlist = new Tasklist({
      title: "tasks",
      owner: mockAddress,
      order: 1,
    });

    await testlist.save();

    const updateResponse = await request(app).put("/tasklist/title").send({
      tasklistId: testlist._id.toString(),
      newTitle: "new Test title",
    });

    const testedList = await Tasklist.findOne({
      title: "new Test title",
    }).lean();

    expect(testedList.title).toBe("new Test title");
    expect(updateResponse.status).toBe(200);
  });
});
