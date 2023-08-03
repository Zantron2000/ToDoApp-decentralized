const mongoose = require("mongoose");
require("dotenv").config();
const request = require("supertest");

const { setupApp } = require("../../src/app");
const { Tasklist, Task } = require("../../src/models/model");

const mockAddress = "0x1234";
const mockAddress2 = "0x4321";

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

  describe("Testing gett all instances of retreiving tasklists of a given owner", () => {
    afterEach(async () => {
      await Tasklist.deleteMany();
    });

    it("Should grab both tasklist's titles and return status 200", async () => {
      const tasklist1 = new Tasklist({
        title: "tasks1",
        owner: mockAddress,
        tasks: [],
        order: 1,
      });
      await tasklist1.save();

      const tasklist2 = new Tasklist({
        title: "tasks2",
        owner: mockAddress,
        tasks: [],
        order: 2,
      });
      await tasklist2.save();

      const response = await request(app)
        .get("/tasklist/allTasklists")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      response.body.forEach((tasklist) => {
        expect(tasklist).toMatchObject({ title: expect.any(String) });
      });
    });

    it("Should grab nothing due to no task lists, returns 200 still", async () => {
      const response = await request(app)
        .get("/tasklist/allTasklists")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(0);
    });

    it("Fails due to invalid body request, returns 400 status", async () => {
      const response = await request(app)
        .get("/tasklist/allTasklists")
        .send({ title: "test title" });

      expect(response.status).toBe(400);
    });

    it("Should grab 2 out of 3 tasklist's titles and return status 200", async () => {
      const tasklist1 = new Tasklist({
        title: "tasks1",
        owner: mockAddress,
        tasks: [],
        order: 1,
      });

      const tasklist2 = new Tasklist({
        title: "tasks2",
        owner: mockAddress,
        tasks: [],
        order: 2,
      });

      const tasklist3 = new Tasklist({
        title: "tasks3",
        owner: mockAddress2,
        tasks: [],
        order: 1,
      });

      await Promise.all([tasklist1.save(), tasklist2.save(), tasklist3.save()]);

      const response = await request(app)
        .get("/tasklist/allTasklists")
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
      response.body.forEach((tasklist) => {
        expect(tasklist).toMatchObject({ title: expect.any(String) });
      });
    });
  });
});
