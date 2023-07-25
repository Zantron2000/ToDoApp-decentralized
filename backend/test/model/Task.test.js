const mongoose = require("mongoose");
const { describe, it, beforeAll, afterAll } = require("@jest/globals");
require("dotenv").config();

const Task = require("../../src/model/Task");

beforeAll(async () => {
  await mongoose.connect(process.env.DB_TEST_URL);
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Tests the Task schema", () => {
  afterEach(async () => {
    await Task.deleteMany({});
  });

  it("Should create a task with the bare minimum details", async () => {
    const task1 = new Task({ title: "test title", owner: "test owner" });
    await task1.save();

    const result = await Task.findOne({ title: "test title" }).lean();
    const expectedResult = {
      title: "test title",
      important: false,
      myDay: false,
      done: false,
      owner: "test owner",
      steps: [],
    };

    expect(result).toMatchObject(expectedResult);
  });

  it("Should fail to create tasks missing required fields", async () => {
    const noTitleTask = new Task({ title: "  ", owner: "test owner" });
    const noOwnerTask = new Task({ title: "abc" });

    await expect(noTitleTask.save()).rejects.toThrow("is required");
    await expect(noOwnerTask.save()).rejects.toThrow("is required");
  });

  it("Should create a task that repeats without a due date", async () => {
    const task1 = new Task({
      title: "test title",
      owner: "test owner",
      repeat: { amount: 1, unit: "DAY" },
    });
    await task1.save();

    const result = await Task.findOne({ title: "test title" }).lean();
    const expectedResult = {
      title: "test title",
      important: false,
      myDay: false,
      done: false,
      repeat: { amount: 1, unit: "DAY" },
      owner: "test owner",
      steps: [],
    };

    expect(result).toMatchObject(expectedResult);
  });

  it("Should create a task that repeats with a due date", async () => {
    const task1 = new Task({
      title: "test title",
      owner: "test owner",
      repeat: { amount: 1, unit: "DAY", dueEvery: { amount: 1, unit: "DAY" } },
    });
    await task1.save();

    const result = await Task.findOne({ title: "test title" }).lean();
    const expectedResult = {
      title: "test title",
      important: false,
      myDay: false,
      done: false,
      repeat: { amount: 1, unit: "DAY", dueEvery: { amount: 1, unit: "DAY" } },
      owner: "test owner",
      steps: [],
    };

    expect(result).toMatchObject(expectedResult);
  });
});
