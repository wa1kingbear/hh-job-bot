import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const createdAt = integer("created_at", { mode: "timestamp" })
  .notNull()
  .default(sql`(unixepoch())`);

export const vacancies = sqliteTable(
  "vacancies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    hhId: text("hh_id").notNull(),
    name: text("name").notNull(),
    employerId: text("employer_id"),
    employerName: text("employer_name").notNull(),
    url: text("url").notNull(),
    salaryFrom: integer("salary_from"),
    salaryTo: integer("salary_to"),
    salaryCurrency: text("salary_currency"),
    salaryGross: integer("salary_gross", { mode: "boolean" }),
    remoteStatus: text("remote_status", {
      enum: ["confirmed", "rejected", "unknown"],
    }).notNull(),
    remoteReason: text("remote_reason"),
    locationCompatible: integer("location_compatible", { mode: "boolean" }),
    experience: text("experience"),
    seniority: text("seniority", {
      enum: ["junior", "middle", "senior", "lead", "staff", "principal", "unknown"],
    }).notNull(),
    primaryStack: text("primary_stack"),
    roleFocus: text("role_focus"),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    firstSeenAt: integer("first_seen_at", { mode: "timestamp" }).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp" }).notNull(),
    notifiedAt: integer("notified_at", { mode: "timestamp" }),
    responsesCount: integer("responses_count"),
    responsesSource: text("responses_source", {
      enum: ["search", "details", "unavailable"],
    }),
    responsesCheckedAt: integer("responses_checked_at", { mode: "timestamp" }),
    ruleScore: real("rule_score"),
    llmScore: real("llm_score"),
    matchScore: real("match_score"),
    freshnessScore: real("freshness_score"),
    competitionScore: real("competition_score"),
    priorityScore: real("priority_score"),
    processingStatus: text("processing_status", {
      enum: [
        "discovered",
        "filtered_out",
        "analyzed",
        "notification_pending",
        "notified",
        "notification_failed",
      ],
    })
      .notNull()
      .default("discovered"),
    userStatus: text("user_status", {
      enum: ["none", "interested", "rejected", "applied", "archived"],
    })
      .notNull()
      .default("none"),
    filterReason: text("filter_reason"),
    rawJson: text("raw_json").notNull(),
  },
  (table) => [uniqueIndex("vacancies_hh_id_unique").on(table.hhId)],
);

export const vacancyAnalysis = sqliteTable("vacancy_analysis", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vacancyId: integer("vacancy_id")
    .notNull()
    .references(() => vacancies.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  matchesJson: text("matches_json").notNull(),
  gapsJson: text("gaps_json").notNull(),
  risksJson: text("risks_json").notNull(),
  llmModel: text("llm_model"),
  confidence: real("confidence"),
  createdAt,
});

export const userFeedback = sqliteTable("user_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  vacancyId: integer("vacancy_id")
    .notNull()
    .references(() => vacancies.id, { onDelete: "cascade" }),
  action: text("action", {
    enum: ["interested", "rejected", "applied", "hide_employer"],
  }).notNull(),
  createdAt,
});

export const blockedEmployers = sqliteTable(
  "blocked_employers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    hhEmployerId: text("hh_employer_id").notNull(),
    name: text("name").notNull(),
    createdAt,
  },
  (table) => [uniqueIndex("blocked_employers_hh_id_unique").on(table.hhEmployerId)],
);

export const settings = sqliteTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
);

export const pollingRuns = sqliteTable("polling_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  status: text("status", { enum: ["running", "success", "partial", "failed"] })
    .notNull()
    .default("running"),
  startedAt: integer("started_at", { mode: "timestamp" }).notNull(),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  foundCount: integer("found_count").notNull().default(0),
  newCount: integer("new_count").notNull().default(0),
  passedCount: integer("passed_count").notNull().default(0),
  notifiedCount: integer("notified_count").notNull().default(0),
  error: text("error"),
});
