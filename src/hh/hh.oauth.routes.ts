import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { HhOAuthError } from "./hh.oauth.client.js";
import { HhOAuthService, InvalidOAuthStateError } from "./hh.oauth.js";

const callbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
});

export function registerHhOAuthRoutes(app: FastifyInstance, service: HhOAuthService): void {
  app.get("/auth/hh", async (_request, reply) => {
    const authorizationUrl = await service.createAuthorizationUrl();
    return reply.redirect(authorizationUrl);
  });

  app.get("/auth/hh/callback", async (request, reply) => {
    const query = callbackQuerySchema.parse(request.query);
    if (query.error) {
      return reply.code(400).type("text/plain").send("HH authorization was denied");
    }
    if (!query.code || !query.state) {
      return reply.code(400).type("text/plain").send("Missing OAuth code or state");
    }

    try {
      await service.completeAuthorization(query.code, query.state);
      return reply.type("text/plain").send("HH authorization completed. You may close this page.");
    } catch (error) {
      if (error instanceof InvalidOAuthStateError) {
        return reply.code(400).type("text/plain").send("OAuth request expired or was already used");
      }
      if (error instanceof HhOAuthError) {
        request.log.error({ status: error.status }, "HH OAuth token exchange failed");
        return reply.code(502).type("text/plain").send("HH token exchange failed");
      }
      throw error;
    }
  });
}
