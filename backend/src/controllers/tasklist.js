const { Tasklist } = require("../models/model"); // schema of the product table

const createTasklist = async (req, res) => {
  const list = new Tasklist({
    title: req.body.title,
    owner: req.user.address,
    order: (await Tasklist.count({ owner: req.user.address })) + 1,
  });

  await list.save();
  return res.status(200).json(list.getPublicFields()).send();
};

module.exports = {
  createTasklist,
};
