import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import * as fs from "fs";
import morgan from "morgan";
import * as path from "path";
import { promisify } from "util";

import { Course } from "@pairwise/common";
import { ContentUtilityClass } from "@pairwise/common/dist/tools/content-utility-class";

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
    return (
      Promise.resolve(this.filepaths[course.id])
        // @ts-ignore
        .then((filepath: string | undefined) => {
          return filepath || this.getAll();
        })
        .then(() => {
          // At this point filepaths should not be empty
          const filepath = this.filepaths[course.id];
          const data = JSON.stringify(course, null, 2);

          return writeFile(filepath, data, { encoding: "utf8" }).then(() => {
            this.cache[course.id] = course;
          });
        })
    );

    // Pretty stringify since we still look at the raw course file sometimes
  };

  getAll = () => {
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

  get = (id: string) => {
    return this.getAll().then(() => {
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

app.get("/courses", (_, res) => {
  api.courses.getAll().then(courses =>
    res.send({
      status: "OK",
      data: courses,
    }),
  );
});

app.get("/skeletons", (_, res) => {
  api.courses
    .getAll()
    .then((xs: Course[]) => {
      const util = new ContentUtilityClass(xs);

      // User can access all modules
      const mockUserAccess = xs
        .map(x => x.modules)
        .reduce((agg, x) => agg.concat(x))
        .reduce((agg, x) => {
          return {
            ...agg,
            [x.id]: true,
          };
        }, {});

      return util.getCourseNavigationSkeletons(mockUserAccess);
    })
    .then(skeletons => {
      res.send({
        status: "OK",
        data: skeletons,
      });
    });
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
