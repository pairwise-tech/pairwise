import dotenv from "dotenv";
dotenv.config();

import { json } from "body-parser";
import cloneBuffer from "clone-buffer";
import morgan from "morgan";
import fs from "fs";
import path from "path";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common/pipes";
import ENV from "./tools/server-env";
import * as Sentry from "@sentry/node";
import compression from "compression";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const PORT = ENV.PORT;

/* Read https certificates: */
const KEY = path.join(__dirname + "/../ssl/pairwise.key");
const CERT = path.join(__dirname + "/../ssl/pairwise.cert");
const keyFile = fs.readFileSync(KEY);
const certFile = fs.readFileSync(CERT);

/* Enable https optionally for locally debugging SSO authentication... */
const httpsOptions = ENV.HTTPS
  ? {
      key: keyFile,
      cert: certFile,
    }
  : undefined;

const swaggerOptions = new DocumentBuilder()
  .setTitle("Pairwise")
  .setDescription("Pairwise APIs")
  .setVersion("1.0")
  .addTag("Learn to Code!")
  .build();

Sentry.init({
  dsn: ENV.SENTRY_DSN,
});

/** ===========================================================================
 * Setup and Run the Server
 * ============================================================================
 */

const pairwise = async () => {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    httpsOptions,
  });

  /* Enable compression */
  app.use(compression());

  /* Enable logging */
  app.use(morgan(ENV.PRODUCTION ? "combined" : "dev"));

  /* Enable validation pipes */
  app.useGlobalPipes(new ValidationPipe());

  app.use(
    json({
      verify: (req: any, res, buf, encoding) => {
        // Important to store rawBody for Stripe signature verification
        // View this: https://yanndanthu.github.io/2019/07/04/Checking-Stripe-Webhook-Signatures-from-NestJS.html
        if (req.headers["stripe-signature"] && Buffer.isBuffer(buf)) {
          req.rawBody = cloneBuffer(buf);
        }
        return true;
      },
    }),
  );

  /* Enable Swagger documentation */
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup("api", app, document);

  /* Start the app */
  await app.listen(PORT);

  console.log(`\n- NestJS app launched on:    http://localhost:${PORT}/`);
  console.log(`- View Swagger API docs:     http://localhost:${PORT}/api\n`);
  console.log(`Pairwise launched!\n`);
};

pairwise();
