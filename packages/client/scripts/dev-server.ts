#!/usr/bin/env node

// const http = require("http");
// const cors = require("cors");
// const express = require("express");
// const path = require("path");
// const fs = require("fs");
// const bodyParser = require("body-parser");
// const morgan = require("morgan");
// const util = require("util");
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import * as fs from "fs";
import { createServer } from "http";
import morgan from "morgan";
import * as path from "path";
import { promisify } from "util";

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const makeCache = data => {
  return data.reduce((agg, x) => {
    return {
      ...agg,
      [x.id]: x,
    };
  }, {});
};

class Course {
  basedir: string;
  cache: any;
  filepaths: { [k: string]: string };

  constructor(basedir) {
    if (!basedir) {
      throw new Error("No course endpoint specified");
    }

    // Where the course files are saved
    this.basedir = path.resolve(__dirname, basedir);

    // A cache to hold on to data once read from disk... this is probably
    // premature optimization though so it might be removed later
    this.cache = null;

    // Hold on to the absolute filepaths for each course. We will need it when
    // updating courses
    this.filepaths = {};
  }

  resolveFromCache = () => {
    return Promise.resolve(Object.values(this.cache));
  };

  getAll = ({ useCache = true } = {}) => {
    if (this.cache && useCache) {
      return this.resolveFromCache();
    }

    return readdir(this.basedir)
      .then(filenames => filenames.map(x => path.resolve(this.basedir, x)))
      .then(filepaths =>
        Promise.all(
          filepaths.map(x => {
            return readFile(x, { encoding: "utf8" })
              .then(JSON.parse)
              .then(course => {
                this.filepaths[course.id] = x;
                return course;
              });
          }),
        ),
      )
      .then(x => {
        this.cache = makeCache(x);
        return this.resolveFromCache();
      });
  };

  get = (id, options = {}) => {
    debugger;
    return this.getAll(options).then(() => {
      return this.cache[id];
    });
  };
}

const api = {
  courses: new Course("../src/challenges"),
};

const app = express();

app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json());

app.get("/courses", (req, res) => {
  api.courses.getAll().then(courses =>
    res.send({
      status: "OK",
      data: courses,
    }),
  );
});

app.get("/courses/:id", (req, res) => {
  api.courses.get(req.params.id).then(course => {
    res.send({
      status: "ok",
      data: course,
    });
  });
});

app.get("/", (req, res) => {
  res.send({
    status: "OK",
    data: null,
  });
});

const server = createServer(app);

const PORT = process.env.SERVER_PORT || 3001;

server.listen(PORT, () => {
  console.log(`[INFO]: Dev server listening at http://localhost:${PORT}`);
});
