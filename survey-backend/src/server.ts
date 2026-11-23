/**
 * Starts the survey server: `make serve` here, or `npm start` after a build.
 * Settings come from the environment (config.ts).
 */

import { createApp } from "./app.ts";
import { configFromEnv } from "./config.ts";
import { depsFromConfig } from "./deps.ts";

const config = configFromEnv();
const deps = await depsFromConfig(config);
// this machine only: the results routes have no login
createApp(config, deps).listen(config.port, "127.0.0.1", (err?: Error) => {
    if (err) {
        // most often the port is taken: SURVEY_PORT picks another
        console.error(`[survey-backend] cannot listen on ${config.port}:`, err);
        process.exit(1);
    }
    console.log(`[survey-backend] http://localhost:${config.port}/survey`);
    console.log(
        config.store === "dynamodb"
            ? `  answers   DynamoDB table ${config.dynamo.table}${config.dynamo.endpoint ? ` at ${config.dynamo.endpoint}` : ""}`
            : `  answers   ${config.logsDir}`,
    );
    console.log(`  surveys   ${config.surveysDir}`);
    console.log(`  quiz.js   ${config.quizLibDist}`);
});
