import autoBind from "auto-bind";
import { RequestApi } from "./requestApi";
import { type Settings, useSettings } from "./settings";
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
    mouseWindow: 5,
    zoom: true,
    backend: "",
};

//------------------------------------------------------------------------------
// UnilensClient implementation
//------------------------------------------------------------------------------

/**
 * A client representing a single instance or connection of the unilens library.
 * Every initialization of unilens on a webpage should have a unilens-client.
 * This establishes a connection to the backend, to localstorage, and any other external resources.
 */
export class UnilensClient {
    /* Params */
    options: Options = kDefaultOptions;
    sessionId: string | null = null;

    /* Other clients */
    requestApi: RequestApi;

    /* Constructor */
    constructor(options: Partial<Options> = {}) {
        autoBind(this);
        // Apply default options
        this.options = {
            ...kDefaultOptions,
            ...options,
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
    getOption(optionKey: OptionKey) {
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
        return useSettings.getState();
    }

    /* Session-related handlers */

    setSessionId(sessionId: string | null) {
        this.sessionId = sessionId;
    }

    getSessionId() {
        return this.sessionId;
    }
}
