import "dotenv/config";
import Fastify from "fastify";
import { loadConfig } from "./config/env.js";

const config = loadConfig();
const app = Fastify({ logger: true });

app.get("/health", async () => ({ status: "ok" }));

async function start(): Promise<void> {
  try {
    await app.listen({ host: config.HOST, port: config.PORT });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

await start();
