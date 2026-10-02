import "dotenv/config";
import Fastify from "fastify";
import { getHhOAuthConfig, loadConfig } from "./config/env.js";
import { createDatabase } from "./db/client.js";
import { HhOAuthClient } from "./hh/hh.oauth.client.js";
import { HhOAuthRepository } from "./hh/hh.oauth.repository.js";
import { registerHhOAuthRoutes } from "./hh/hh.oauth.routes.js";
import { HhOAuthService } from "./hh/hh.oauth.js";

const config = loadConfig();
const app = Fastify({ logger: true });
const oauthConfig = getHhOAuthConfig(config);

app.get("/health", async () => ({
  status: "ok",
  hhOAuthConfigured: oauthConfig !== null,
}));

if (oauthConfig) {
  const database = createDatabase(config);
  const oauthRepository = new HhOAuthRepository(database.db);
  const oauthClient = new HhOAuthClient({ userAgent: oauthConfig.userAgent });
  const oauthService = new HhOAuthService(oauthConfig, oauthRepository, oauthClient);
  registerHhOAuthRoutes(app, oauthService);
  app.addHook("onClose", async () => database.close());
}

async function start(): Promise<void> {
  try {
    await app.listen({ host: config.HOST, port: config.PORT });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

await start();
