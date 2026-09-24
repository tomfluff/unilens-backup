import { RequestApi } from "./requestApi";
import { getSettings, type Settings } from "./settings";
import type { Trigger } from "./types";

//------------------------------------------------------------------------------
// Types
//------------------------------------------------------------------------------

export type Options = {
    trigger: Trigger; // the predicate to determine if to open the unilens popover or not
    mouseWindow: number;
    backend: string;
    /** ctrl+wheel pinch-style page zoom. Default: true. */
    zoom: boolean;
};

export type OptionKey = keyof Options;

//------------------------------------------------------------------------------
// Consts
//------------------------------------------------------------------------------

// Represents default options, used for fetching options if they are not defined
const kDefaultOptions: Options = {
    trigger: (e: MouseEvent) => e.altKey,
    mouseWindow: 2.5,
    zoom: true,
    backend: "",
};

//------------------------------------------------------------------------------
// UnilensClient implementation
//------------------------------------------------------------------------------

/**
 * A client representing a single instance or connection of the unilens library.
 * Every initialization of unilens on a webpage should have a unilens-client.
 * This establishes a connection to the backend and any other external resources.
 */
export class UnilensClient {
    /* Params */
    options: Options = kDefaultOptions;
    /** the conversation session: new captures join it until the user closes the chat */
    sessionId: string | null = null;

    /* Other clients */
    requestApi: RequestApi;

    /* Constructor */
    constructor(options: Partial<Options> = {}) {
        // Apply default options, also for options given as undefined
        const given = Object.fromEntries(
            Object.entries(options).filter(([, v]) => v != null),
        );
        this.options = {
            ...kDefaultOptions,
            ...given,
        };
        // Set up clients
        this.requestApi = new RequestApi(this);
    }

    /* Client shims */
    api(): RequestApi {
        return this.requestApi;
    }

    /* Options-related handlers */

    // Get an option by key, accounting for defaults
    getOption<K extends OptionKey>(optionKey: K): Options[K] {
        return this.options[optionKey];
    }

    getOptions(): Options {
        return { ...this.options };
    }

    getBackend() {
        return this.options.backend;
    }

    /* Settings-related handlers */
    getSettings(): Settings {
        return getSettings();
    }

    /* Session-related handlers */

    setSessionId(sessionId: string | null) {
        this.sessionId = sessionId;
    }

    getSessionId() {
        return this.sessionId;
    }
}
