const loggedIn = (req, res, next) => {
  if (req?.ssx?.verified) {
    req.user = { address: req.ssx.siwe.data.address };
    return next();
  }

  res.status(401).send({
    error: "UnauthorizedError",
    message: "User must be authenticated",
  });
};

const postmanLogin = (req, res, next) => {
  if (req?.body?.address) {
    req.user = { address: req.body.address };
    delete req.body.address;

    return next();
  }

  res.status(401).send({
    error: "PostmanError",
    message: "Include additional address property in body to fake SSX login",
  });
};

module.exports = {
  loggedIn,
  postmanLogin,
};
