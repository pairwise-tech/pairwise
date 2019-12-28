import dotenv from "dotenv";
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

/** ===========================================================================
 * Types & Config
 * ============================================================================
 */

const PORT = 9000;

const swaggerOptions = new DocumentBuilder()
  .setTitle("Mono Prototype")
  .setDescription("Mono Prototype API description")
  .setVersion("1.0")
  .addTag("coding")
  .build();

/** ===========================================================================
 * Setup and Run the Server
 * ============================================================================
 */

const main = async () => {
  const app = await NestFactory.create(AppModule, { cors: true });

  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup("api", app, document);

  await app.listen(PORT);
  console.log(`\n- NestJS application launched on http://localhost:${PORT}/`);
  console.log(`- View Swagger API at http://localhost:${PORT}/api\n`);
};

main();
