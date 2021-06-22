import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import * as fs from "fs";
import morgan from "morgan";
import * as path from "path";
import { promisify } from "util";
import fileUpload from "express-fileupload";

import { Course, ContentUtilityClass, CourseList } from "@pairwise/common";

// eslint-disable-next-line
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
      .then(filenames => {
        // Sort the filenames for a definitive order:
        return filenames.sort().map(x => path.resolve(this.basedir, x));
      })
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
      .then((courses: CourseList) => {
        /**
         * NOTE: A better solution would be to unify reading the courses
         * in the ContentUtilityClass API. If Codepress used that,
         * ContentUtilityClass will need to be able to "re-read" the
         * courses to get the updated version after saving them. This
         * will require using the fs module in ContentUtilityClass,
         * because the client workspace imports from common/ which caused
         * webpack to be unable to resolve the fs module, even though
         * the workspace doesn't use the ContentUtilityClass directly.
         *
         * Because we rarely add new courses, just manually reordering
         * the courses here turned out to be a much simpler solution. The
         * course filenames are sorted before they are read so they
         * will be in a predicable order here.
         */

        // NOTE: Only the Fullstack TypeScript course is included for now.
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [PairwiseContent, FullstackTypeScript, Rust] = courses;

        // Manually match the order provided by ContentUtilityClass:
        const courseList = [Rust, FullstackTypeScript];
        this.cache = makeCache(courseList);
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
app.use(bodyParser.json({ limit: "10mb" }));
app.use(
  fileUpload({
    createParentPath: true,
  }),
);

app.post("/assets/:resourceId", (req, res, next) => {
  const { resourceId } = req.params;
  if (!resourceId || !resourceId.length) {
    const err = new Error("No resourceId found for upload request");
    next(err);
    return;
  }

  const relDir = `assets/${req.params.resourceId}`;
  const absDir = path.resolve(__dirname, "../../public", relDir);
  // We only care about one file, and this just makes the types pass
  const file = Array.isArray(req.files.asset)
    ? req.files.asset[0]
    : req.files.asset;
  const filename = `${file.md5}_${file.name}`;
  const filepath = path.join(absDir, filename);

  console.log(`[UPLOAD] saving file for ${resourceId} at ${filepath}`);
  file.mv(filepath, err => {
    if (err) {
      next(err);
      return;
    }

    res.send({
      status: "OK",
      data: {
        filepath: path.join("/", relDir, filename),
      },
    });
  });
});

app.get("/courses", (_, res) => {
  // NOTE: This returns the entire course and doesn't filter free content.
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
    .then((xs: any) => {
      const courseList = xs as Course[];
      const util = new ContentUtilityClass(courseList);

      // Codepress user "purchased" all existing courses
      const allAccessPass = xs
        .map(x => x.id)
        .reduce((courseIdMap, id) => {
          return {
            ...courseIdMap,
            [id]: true,
          };
        }, {});

      return util.getCourseNavigationSkeletons(allAccessPass);
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

app.use((err, _, res, __) => {
  res.status(500).send({
    status: "Error",
    data: null,
    error: err.message,
  });
});

export default app;
