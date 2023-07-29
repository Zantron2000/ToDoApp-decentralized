const Task = require("../model/Task");

/**
 * Gets all tasks that an address owns that are marked as important
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response full of all the tasks marked important
 */
const getImportantTasks = async (req, res) => {
  const { address: owner } = req.user;

  const tasks = await Task.find({ owner, important: true })
    .select("-__v -insertedDateTime -updatedDateTime")
    .lean();

  return res.status(200).json(tasks).send();
};

/**
 * Gets all tasks that an address owns that are marked to be done today
 *
 * @param {import("express").Request} req The incoming API request
 * @param {import("express").Response} res The outgoing API response
 * @returns A response full of all the tasks marked to be done today
 */
const getMyDayTasks = async (req, res) => {
  const { address: owner } = req.user;

  const tasks = await Task.find({ owner, myDay: true })
    .select("-__v -insertedDateTime -updatedDateTime")
    .lean();

  return res.status(200).json(tasks).send();
};

module.exports = {
  getImportantTasks,
  getMyDayTasks,
};
