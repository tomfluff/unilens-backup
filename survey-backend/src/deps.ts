/**
 * The handlers' dependencies as the configuration asks: the answers in JSONL
 * files (the default) or in DynamoDB. The AWS SDK is loaded only for the
 * latter, so the JSONL server and the tests never touch it.
 */

import type { SurveyConfig } from "./config.ts";
import type { Deps } from "./handlers/http.ts";
import { FileDefinitions } from "./store/fileDefinitions.ts";
import { JsonlStore } from "./store/jsonlStore.ts";
import type { QuizEventStore } from "./store/types.ts";

export async function eventStore(
    config: SurveyConfig,
): Promise<QuizEventStore> {
    if (config.store === "jsonl") return new JsonlStore(config.logsDir);
    const { dynamoApi, dynamoClient } = await import("./store/dynamoSdk.ts");
    const { DynamoStore } = await import("./store/dynamoStore.ts");
    return new DynamoStore(
        dynamoApi(dynamoClient(config.dynamo), config.dynamo.table),
    );
}

export async function depsFromConfig(config: SurveyConfig): Promise<Deps> {
    return {
        events: await eventStore(config),
        surveys: new FileDefinitions(config.surveysDir),
        now: () => new Date(),
    };
}
