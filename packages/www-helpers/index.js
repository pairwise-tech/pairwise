"use strict";

exports.http = (request, response) => {
  response.status(200).send("Hello World!");
};

exports.anotherFn = (req, res) => {
  res.status(200).send({
    method: req.method,
    body: req.body,
    query: req.query,
  });
};

exports.event = (event, callback) => {
  callback();
};
