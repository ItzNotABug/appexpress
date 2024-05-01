// noinspection JSUnusedGlobalSymbols

/**
 * Represents the incoming http request.
 */
class AppExpressRequest {
    /** @type AppwriteFunctionContext */
    #context;

    /** @type Object */
    #request;

    /** @type string */
    #requestPath;

    /**
     * Initializes a new instance of the `AppExpressRequest` class.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     */
    constructor(context) {
        this.#context = context;
        this.#request = context.req;

        /**
         * evaluate request path replacement logic here in the constructor
         * as `path` can be called multiple times during a function's lifecycle.
         */
        this.#requestPath =
            this.#request.path === '/'
                ? this.#request.path
                : this.#request.path.replace(/\/+$/, '');
    }

    /**
     * Gets the raw body of the request if present.
     *
     * @returns {string|undefined} The raw request body or undefined if not set.
     */
    get bodyRaw() {
        return this.#request.bodyRaw;
    }

    /**
     * Gets the parsed body of the request if present.
     *
     * @returns {Object|{}} The request body or empty if not set.
     */
    get body() {
        if (typeof this.#request.body === 'string' && this.#request.body) {
            try {
                return JSON.parse(this.#request.body);
            } catch (error) {
                this.#context.error(
                    `Failed to parse request body as JSON: ${error}`,
                );
            }
        }
        return this.#request.body || {};
    }

    /**
     * Gets the headers of the request.
     *
     * @returns {Object<string, any>} The request headers.
     */
    get headers() {
        return this.#request.headers;
    }

    /**
     * Get the request scheme (http or https).
     *
     * @returns {string} The scheme of the request.
     */
    get scheme() {
        return this.#request.scheme;
    }

    /**
     * Get the request method (GET, POST, etc.)
     *
     * @returns {string} The raw request body.
     */
    get method() {
        return this.#request.method.toLowerCase();
    }

    /**
     * Get the url of the request.
     *
     * @returns {string} The full URL.
     */
    get url() {
        return this.#request.url;
    }

    /**
     * Get the hostname of the URL.
     *
     * @returns {string} The URL host.
     */
    get host() {
        return this.#request.host;
    }

    /**
     * Get the port from the URL.
     *
     * @returns {number} The URL port.
     */
    get port() {
        return parseInt(this.#request.port, 10);
    }

    /**
     * Get the path part of the URL.
     *
     * @returns {string} The URL path.
     */
    get path() {
        return this.#requestPath;
    }

    /**
     * Get the raw query params string from the URL.
     *
     * @returns {string} The query string.
     */
    get queryString() {
        return this.#request.queryString;
    }

    /**
     * Get the params.
     *
     * @returns {Object<string, any>} The parsed params.
     */
    get params() {
        return this.#request.params ?? {};
    }

    /**
     * Get the parsed query params from the URL.
     *
     * @returns {Object|{}} The parsed params or empty if not set.
     */
    get query() {
        if (typeof this.#request.query === 'string' && this.#request.query) {
            try {
                return JSON.parse(this.#request.query);
            } catch (error) {
                this.#context.error(
                    `Failed to parse request query as JSON: ${error}`,
                );
            }
        }
        return this.#request.query || {};
    }

    /**
     * Get the function trigger type.
     *
     * Can be `event`, `http` or `scheduled`.
     *
     * @returns {'event'|'http'|'scheduled'} The trigger type.
     */
    get triggeredType() {
        return this.headers['x-appwrite-trigger'];
    }

    /**
     * Event mapping based on the event type.
     *
     * @returns {{ [key: string]: string }|undefined} The events data in key, value pair.
     */
    get events() {
        if (this.#fullEventType) {
            return this.#eventTypeParse(this.#fullEventType);
        }
        return undefined;
    }

    /**
     * Parse the event type into a more specific form
     *
     * @returns {string|undefined} Specific event type.
     */
    get eventType() {
        if (this.#fullEventType) {
            return this.#getSpecificEventType(this.#fullEventType);
        }
        return undefined;
    }

    /**
     * Retrieves an instance based on its type and optional identifier.
     *
     * @param {Function} type - The constructor of the type to retrieve.
     * @param {string} identifier='' - An optional identifier for the instance.
     * @returns {any} The requested instance.
     * @throws {Error} - If no instance is found or if multiple instances are found without an identifier.
     */
    retrieve(type, identifier = '') {
        const objectName = type.name;
        const key = identifier ? `${objectName}:${identifier}` : objectName;

        if (!this.#request._dependencies.has(key)) {
            if (identifier) {
                throw new Error(
                    `No instance found for '${objectName}' with identifier '${identifier}'.`,
                );
            } else {
                throw new Error(`No instance found for '${objectName}'.`);
            }
        }

        return this.#request._dependencies.get(key).instance;
    }

    /**
     * Converts the `AppExpressRequest` instance into a string representation formatted as JSON.
     *
     * @returns {string} A stringified JSON representation of the instance with properties grouped under
     * network details, request data, and operational details.
     *
     * The properties included are:
     * - Network and Connection Details: scheme, host, port, method
     * - Request Data: url, path, queryString, query, headers, body, params
     * - Operational Details: triggeredType, events, eventType
     */
    dump() {
        return JSON.stringify(
            {
                // Network Details
                scheme: this.scheme,
                host: this.host,
                port: this.port,
                method: this.method,

                // Request Data
                url: this.url,
                path: this.path,
                queryString: this.queryString,
                query: this.query,
                headers: this.headers,
                body: this.body,
                params: this.params,

                // Operational Details
                triggeredType: this.triggeredType,
                events: this.events,
                eventType: this.eventType,
            },
            null,
            2,
        );
    }

    /**
     * Get the event name if function triggered by an `event`.
     *
     * @returns {string|undefined} The event name.
     */
    get #fullEventType() {
        return this.triggeredType === 'event'
            ? this.headers['x-appwrite-event']
            : undefined;
    }

    /**
     * @param {string} eventType - The full event type string
     * @returns {{ [key: string]: string }} Parsed event map
     */
    #eventTypeParse(eventType) {
        if (!eventType) return {};

        const eventsMap = {};
        const parts = eventType.split('.');
        for (let i = 0; i < parts.length; i += 2)
            eventsMap[parts[i]] = parts[i + 1];

        return eventsMap;
    }

    /**
     * @param {string} eventType - The full event type string
     * @returns {string | undefined} Specific event type
     */
    #getSpecificEventType(eventType) {
        const segments = eventType.split('.');
        return segments[segments.length - 1];
    }
}

export default AppExpressRequest;
