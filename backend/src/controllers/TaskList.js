const TaskList = require("../model/TaskList"); // schema of the product table

exports.create_TaskList = async (req, res) => {
  console.log(req);

  const list = new TaskList({
    title: req.body.title,
    owner: req.user.address,
    order: req.body.order,
  });

  await list.save();
  return res.status(200).json(list).send();
};
