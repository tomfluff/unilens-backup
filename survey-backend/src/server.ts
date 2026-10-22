/**
 * Starts the survey server: `make serve` here, or `npm start` after a build.
 * Settings come from the environment (config.ts).
 */

import { createApp } from "./app.ts";
import { configFromEnv } from "./config.ts";

const config = configFromEnv();
createApp(config).listen(config.port, (err?: Error) => {
    if (err) {
        // most often the port is taken: SURVEY_PORT picks another
        console.error(`[survey-backend] cannot listen on ${config.port}:`, err);
        process.exit(1);
    }
    console.log(`[survey-backend] http://localhost:${config.port}/survey`);
    console.log(`  answers   ${config.logsDir}`);
    console.log(`  surveys   ${config.surveysDir}`);
    console.log(`  quiz.js   ${config.quizLibDist}`);
});
