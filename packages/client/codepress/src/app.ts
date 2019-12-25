import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import * as fs from "fs";
import morgan from "morgan";
import * as path from "path";
import { promisify } from "util";

import { Course } from "../../src/modules/challenges/types";

const debug = require("debug")("codepress:app");

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const makeCache = data => {
  return data.reduce((agg, x) => {
    return {
      ...agg,
      [x.id]: x,
    };
  }, {});
};

class CourseAPI {
  basedir: string;
  cache: any;
  filepaths: { [k: string]: string };

  constructor(basedir) {
    if (!basedir) {
      throw new Error("No course endpoint specified");
    }

    // Where the course files are saved
    this.basedir = path.resolve(__dirname, basedir);

    debug(`[INFO] Initialized with basedir: ${this.basedir}`);

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

  saveCourse = (course: Course) => {
    const filepath = this.filepaths[course.id];

    // Pretty stringify since we still look at the raw course file sometimes
    const data = JSON.stringify(course, null, 2);

    return writeFile(filepath, data, { encoding: "utf8" }).then(() => {
      this.cache[course.id] = course;
    });
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
    return this.getAll(options).then(() => {
      return this.cache[id];
    });
  };
}

const api = {
  courses: new CourseAPI("../../../common/src/courses"),
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
      status: "OK",
      data: course,
    });
  });
});

app.post("/courses", (req, res) => {
  debugger;
  api.courses.saveCourse(req.body as Course).then(() => {
    res.send({
      status: "OK",
      data: null,
    });
  });
});

app.get("/", (req, res) => {
  res.send({
    status: "OK",
    data: null,
  });
});

export default app;
