/**
 * Create the answers' DynamoDB table (SURVEY_TABLE, default unilens-survey)
 * unless it exists: `npm run db:table`. Meant for DynamoDB Local
 * (DYNAMODB_ENDPOINT); on AWS the table is better made where the rest of the
 * infrastructure is, from the same definition (dynamoSdk.ts, tableDefinition).
 */

import { configFromEnv } from "../config.ts";
import { dynamoClient, ensureTable } from "../store/dynamoSdk.ts";

const { dynamo } = configFromEnv();
const where = dynamo.endpoint ?? "AWS";
const created = await ensureTable(dynamoClient(dynamo), dynamo.table);
console.log(
    created
        ? `[survey-backend] created table ${dynamo.table} at ${where}`
        : `[survey-backend] table ${dynamo.table} already exists at ${where}`,
);
