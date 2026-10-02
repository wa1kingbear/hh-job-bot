import { z } from "zod";

const booleanFromString = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().default("./data/jobs.db"),
  POLL_INTERVAL_SECONDS: z.coerce.number().int().min(120).default(1800),
  MIN_MATCH_SCORE: z.coerce.number().min(0).max(100).default(70),
  MAX_VACANCY_AGE_HOURS: z.coerce.number().positive().default(24),
  REMOTE_ONLY: booleanFromString.default(true),
  HH_CLIENT_ID: z.string().optional(),
  HH_CLIENT_SECRET: z.string().optional(),
  HH_REDIRECT_URI: z.string().url().optional(),
  HH_USER_AGENT: z.string().min(1).optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  return envSchema.parse(environment);
}
