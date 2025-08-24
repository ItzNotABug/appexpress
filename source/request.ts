import type { AppwriteContext, AppwriteRequest } from './types/index.js';

/**
 * Represents the incoming http request.
 */
export default class AppExpressRequest {
    readonly #requestPath: string;
    readonly #request: AppwriteRequest;
    readonly #context: AppwriteContext;

    /**
     * Initializes a new instance of the `AppExpressRequest` class.
     *
     * @param context - The context provided by the executed `Appwrite Function`.
     */
    constructor(context: AppwriteContext) {
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
     * @returns The raw request body or undefined if not set.
     * @deprecated Use `bodyText` instead.
     */
    get bodyRaw(): string | undefined {
        return this.bodyText;
    }

    /**
     * Gets the raw body of the request as text if present.
     *
     * @returns The raw request body or undefined if not set.
     */
    get bodyText(): string | undefined {
        return this.#request.bodyText;
    }

    /**
     * Gets the parsed body of the request if present.
     *
     * @returns The request body or empty if not set.
     * @deprecated Use `bodyJson` instead.
     */
    get body(): Record<string, any> {
        return this.bodyJson;
    }

    /**
     * Gets the parsed body of the request if present.
     *
     * @returns The request body or empty if not set.
     */
    get bodyJson(): Record<string, unknown> {
        if (typeof this.#request.body === 'string' && this.#request.body) {
            try {
                return JSON.parse(this.#request.body);
            } catch (error) {
                this.#context.error(
                    `Failed to parse request body as JSON: ${error}`,
                );
            }
        }
        return typeof this.#request.body === 'object' ? this.#request.body : {};
    }

    /**
     * Gets the binary content/file from the request if present.
     *
     * @returns The binary content if available.
     */
    get bodyBinary(): Buffer {
        return this.#request.bodyBinary;
    }

    /**
     * Gets the headers of the request.
     *
     * @returns The request headers.
     */
    get headers(): Record<string, string> {
        return this.#request.headers;
    }

    /**
     * Get the request scheme (http or https).
     *
     * @returns The scheme of the request.
     */
    get scheme(): string {
        return this.#request.scheme;
    }

    /**
     * Get the request method (GET, POST, etc.)
     *
     * @returns The request method in lowercase.
     */
    get method(): string {
        return this.#request.method.toLowerCase();
    }

    /**
     * Get the url of the request.
     *
     * @returns The full URL.
     */
    get url(): string {
        return this.#request.url;
    }

    /**
     * Get the hostname of the URL.
     *
     * @returns The URL host.
     */
    get host(): string {
        return this.#request.host;
    }

    /**
     * Get the port from the URL.
     *
     * @returns The URL port.
     */
    get port(): number {
        return this.#request.port;
    }

    /**
     * Get the path part of the URL.
     *
     * @returns The URL path.
     */
    get path(): string {
        return this.#requestPath;
    }

    /**
     * Get the raw query params string from the URL.
     *
     * @returns The query string.
     */
    get queryString(): string {
        return this.#request.queryString;
    }

    /**
     * Get the params.
     *
     * @returns The parsed params.
     */
    get params(): Record<string, string> {
        return this.#request.params ?? {};
    }

    /**
     * Get the parsed query params from the URL.
     *
     * @returns The parsed params or empty if not set.
     */
    get query(): Record<string, string> {
        return this.#request.query || {};
    }

    /**
     * Get the function trigger type.
     *
     * Can be `event`, `http` or `schedule`.
     *
     * @returns The trigger type.
     */
    get triggeredType(): 'event' | 'http' | 'schedule' {
        return this.headers['x-appwrite-trigger'] as
            | 'event'
            | 'http'
            | 'schedule';
    }

    /**
     * Event mapping based on the event type.
     *
     * @returns The events data in key, value pair.
     */
    get events(): Record<string, string> | undefined {
        if (this.#fullEventType) {
            return this.#eventTypeParse(this.#fullEventType);
        }
        return undefined;
    }

    /**
     * Parse the event type into a more specific form
     *
     * @returns Specific event type.
     */
    get eventType(): string | undefined {
        if (this.#fullEventType) {
            return this.#getSpecificEventType(this.#fullEventType);
        }
        return undefined;
    }

    /**
     * Retrieves an instance based on its type and optional identifier.
     *
     * @param type - The constructor of the type to retrieve.
     * @param identifier - An optional identifier for the instance.
     * @returns The requested instance.
     * @throws If no instance is found or if multiple instances are found without an identifier.
     */
    retrieve<T>(type: new (...args: any[]) => T, identifier: string = ''): T {
        const objectName = type.name;
        const key = identifier ? `${objectName}:${identifier}` : objectName;

        if (!this.#request._dependencies?.has(key)) {
            if (identifier) {
                throw new Error(
                    `No instance found for '${objectName}' with identifier '${identifier}'.`,
                );
            } else {
                throw new Error(`No instance found for '${objectName}'.`);
            }
        }

        const dependency = this.#request._dependencies.get(key);
        if (!dependency) {
            if (identifier) {
                throw new Error(
                    `No instance found for '${objectName}' with identifier '${identifier}'.`,
                );
            } else {
                throw new Error(`No instance found for '${objectName}'.`);
            }
        }
        return dependency.instance as T;
    }

    /**
     * Converts the `AppExpressRequest` instance into a string representation formatted as JSON.
     *
     * @returns A stringified JSON representation of the instance with properties grouped under
     * network details, request data, and operational details.
     *
     * The properties included are:
     * - Network and Connection Details: scheme, host, port, method
     * - Request Data: url, path, queryString, query, headers, body, params
     * - Operational Details: triggeredType, events, eventType
     */
    dump(): string {
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
                body: this.bodyJson,
                params: this.params,
                binary: !!this.bodyBinary,

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
     * @returns The event name.
     */
    get #fullEventType(): string | undefined {
        return this.triggeredType === 'event'
            ? this.headers['x-appwrite-event']
            : undefined;
    }

    /**
     * @param eventType - The full event type string
     * @returns Parsed event map
     */
    #eventTypeParse(eventType: string): Record<string, string> {
        if (!eventType) return {};

        const eventsMap: Record<string, string> = {};
        const parts = eventType.split('.');
        for (let i = 0; i < parts.length; i += 2) {
            const key = parts[i];
            const value = parts[i + 1];
            if (key && value) {
                eventsMap[key] = value;
            }
        }

        return eventsMap;
    }

    /**
     * @param eventType - The full event type string
     * @returns Specific event type
     */
    #getSpecificEventType(eventType: string): string | undefined {
        const segments = eventType.split('.');
        return segments[segments.length - 1];
    }
}
