const mongoose = require("mongoose");
const { describe, it, beforeAll, afterAll } = require("@jest/globals");
require("dotenv").config();

const { Task, Tasklist } = require("../../src/models/model");

beforeAll(async () => {
  await mongoose.connect(process.env.DB_TEST_URL);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Tests the Tasklist schema", () => {
  afterEach(async () => {
    // await Task.deleteMany({});
    // await Tasklist.deleteMany({});
  });

  it("Should create an empty Tasklist with the bare minimum requirements", async () => {
    const tasklist = new Tasklist({
      title: "test title",
      owner: "test owner",
      order: 1,
    });
    await tasklist.save();

    const result = await Tasklist.findOne({ title: "test title" }).lean();
    const expectedResult = {
      title: "test title",
      owner: "test owner",
      order: 1,
      tasks: [],
    };
    expect(result).toMatchObject(expectedResult);
  });

  it("Should be able to reference an existing task in it's array", async () => {
    const task1 = new Task({ title: "test task", owner: "test owner" });
    await task1.save();

    const tasklist = new Tasklist({
      title: "test title",
      owner: "test owner",
      order: 1,
      tasks: [task1._id],
    });
    await tasklist.save();

    const results = await Tasklist.findOne({ title: "test title" })
      .populate({
        path: "tasks",
        model: "Task",
      })
      .exec();

    expect(results.tasks).toHaveLength(1);
    expect(results.tasks[0]).toMatchObject({
      title: "test task",
      owner: "test owner",
    });
  });

  it("Should throw an error due to order not being an integer", async () => {
    const tasklist = new Tasklist({
      title: "test title",
      owner: "test owner",
      order: 1.5,
    });

    await expect(() => tasklist.save()).rejects.toThrow("Must be an integer");
  });
});
