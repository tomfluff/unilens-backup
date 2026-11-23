/**
 * Copy the JSONL answers' logs (SURVEY_LOGS_DIR, default quiz-logs/) into the
 * DynamoDB table: `npm run db:import`. Each survey keeps its order, and the
 * keys come from each line's place in its file, so running it again rewrites
 * the same items instead of adding copies. The JSONL files are left as they are.
 */

import { configFromEnv } from "../config.ts";
import { dynamoApi, dynamoClient } from "../store/dynamoSdk.ts";
import { DynamoStore } from "../store/dynamoStore.ts";
import { JsonlStore } from "../store/jsonlStore.ts";

const config = configFromEnv();
const from = new JsonlStore(config.logsDir);
const to = new DynamoStore(
    dynamoApi(dynamoClient(config.dynamo), config.dynamo.table),
);
const quizzes = await from.quizzes();
if (!quizzes.length)
    console.log(`[survey-backend] no logs in ${config.logsDir}`);
for (const quiz of quizzes) {
    const events = (await from.read(quiz)) ?? [];
    await to.load(events);
    console.log(`[survey-backend] ${quiz}: ${events.length} events copied`);
}
