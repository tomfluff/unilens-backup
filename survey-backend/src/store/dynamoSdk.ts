/**
 * DynamoApi on the AWS SDK, and the table it expects. The only file that
 * imports the SDK: the server loads it only when SURVEY_STORE=dynamodb.
 *
 * Credentials and region come from the SDK's usual chain (environment,
 * profile, the Lambda role). With an endpoint (DynamoDB Local) and no
 * credentials set, placeholder ones are used: DynamoDB Local accepts any.
 */

import {
    BatchWriteItemCommand,
    CreateTableCommand,
    type CreateTableCommandInput,
    DescribeTableCommand,
    DynamoDBClient,
    QueryCommand,
    ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import type { DynamoApi, Item } from "./dynamoStore.ts";

export interface DynamoConfig {
    table: string;
    /** e.g. http://localhost:8100 for DynamoDB Local; unset for AWS */
    endpoint?: string;
    region?: string;
}

/** The table: the survey id as partition key, the arrival-ordered key as sort key. */
export function tableDefinition(table: string): CreateTableCommandInput {
    return {
        TableName: table,
        AttributeDefinitions: [
            { AttributeName: "quiz", AttributeType: "S" },
            { AttributeName: "seq", AttributeType: "S" },
        ],
        KeySchema: [
            { AttributeName: "quiz", KeyType: "HASH" },
            { AttributeName: "seq", KeyType: "RANGE" },
        ],
        BillingMode: "PAY_PER_REQUEST",
    };
}

export function dynamoClient(config: DynamoConfig): DynamoDBClient {
    const local = Boolean(config.endpoint) && !process.env.AWS_ACCESS_KEY_ID;
    return new DynamoDBClient({
        endpoint: config.endpoint || undefined,
        region: config.region || process.env.AWS_REGION || "ap-northeast-1",
        ...(local && {
            credentials: { accessKeyId: "local", secretAccessKey: "local" },
        }),
    });
}

export function dynamoApi(client: DynamoDBClient, table: string): DynamoApi {
    return {
        async batchPut(items) {
            const out = await client.send(
                new BatchWriteItemCommand({
                    RequestItems: {
                        [table]: items.map((Item) => ({
                            PutRequest: { Item },
                        })),
                    },
                }),
            );
            return (out.UnprocessedItems?.[table] ?? []).flatMap((r) =>
                r.PutRequest?.Item ? [r.PutRequest.Item as Item] : [],
            );
        },
        async queryPage(quiz, startKey) {
            const out = await client.send(
                new QueryCommand({
                    TableName: table,
                    KeyConditionExpression: "#q = :q",
                    ExpressionAttributeNames: { "#q": "quiz" },
                    ExpressionAttributeValues: { ":q": { S: quiz } },
                    // the survey page waits for its answer to be written, then
                    // the test page asks for progress: it must see that answer
                    ConsistentRead: true,
                    ExclusiveStartKey: startKey,
                }),
            );
            return {
                items: (out.Items ?? []) as Item[],
                next: out.LastEvaluatedKey as Item | undefined,
            };
        },
    };
}

/** Create the table unless it exists, and wait until it can be used. Returns whether it was created. */
export async function ensureTable(
    client: DynamoDBClient,
    table: string,
): Promise<boolean> {
    let created = false;
    try {
        await client.send(new DescribeTableCommand({ TableName: table }));
    } catch (err) {
        if (!(err instanceof ResourceNotFoundException)) throw err;
        await client.send(new CreateTableCommand(tableDefinition(table)));
        created = true;
    }
    for (let i = 0; i < 60; i++) {
        const { Table } = await client.send(
            new DescribeTableCommand({ TableName: table }),
        );
        if (Table?.TableStatus === "ACTIVE") return created;
        await new Promise((done) => setTimeout(done, 1000));
    }
    throw new Error(`table ${table} did not become ACTIVE`);
}
