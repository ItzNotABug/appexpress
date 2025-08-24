/** TypeScript type definitions for AppExpress based on Appwrite runtime */

/**
 * The request object structure from Appwrite runtime server.js
 */
export interface AppwriteRequest {
    /** Request body - returns bodyJson for JSON content-type, otherwise bodyText */
    readonly body: string | Record<string, unknown>;
    /** @deprecated Use bodyText instead */
    readonly bodyRaw: string;
    /** Raw body as text */
    readonly bodyText: string;
    /** Parsed JSON body */
    readonly bodyJson: Record<string, unknown>;
    /** Raw binary body buffer */
    readonly bodyBinary: Buffer;
    /** Request headers */
    readonly headers: Record<string, string>;
    /** HTTP method */
    readonly method: string;
    /** Host name */
    readonly host: string;
    /** URL scheme (http/https) */
    readonly scheme: string;
    /** Parsed query parameters */
    readonly query: Record<string, string>;
    /** Raw query string */
    readonly queryString: string;
    /** Port number */
    readonly port: number;
    /** Full URL */
    readonly url: string;
    /** URL path */
    readonly path: string;
    /** Route parameters (added by AppExpress) */
    params?: Record<string, string>;
    /** Dependencies registry (added by AppExpress) */
    _dependencies?: InjectionRegistry;
}

/**
 * The response object structure from Appwrite runtime server.js
 */
export interface AppwriteResponse {
    /**
     * Send response with custom body, status and headers
     */
    send(
        body: unknown,
        statusCode?: number,
        headers?: Record<string, string | number | boolean>,
    ): AppwriteResponseObject;

    /**
     * Send text response
     */
    text(
        body: string,
        statusCode?: number,
        headers?: Record<string, string | number | boolean>,
    ): AppwriteResponseObject;

    /**
     * Send binary response
     */
    binary(
        bytes: Buffer | Promise<string | Buffer>,
        statusCode?: number,
        headers?: Record<string, string | number | boolean>,
    ): AppwriteResponseObject;

    /**
     * Send JSON response
     */
    json(
        obj: unknown,
        statusCode?: number,
        headers?: Record<string, string | number | boolean>,
    ): AppwriteResponseObject;

    /**
     * Send empty response
     */
    empty(): AppwriteResponseObject;

    /**
     * Send redirect response
     */
    redirect(
        url: string,
        statusCode?: number,
        headers?: Record<string, string | number | boolean>,
    ): AppwriteResponseObject;

    /** Dynamic response data (added by AppExpress) */
    dynamic?: AppwriteResponseObject;

    /** Views directory (added by AppExpress) */
    _views?: string;

    /** View engines (added by AppExpress) */
    _engine?: AppExpressViewEngineHandler;

    /** Base directory (added by AppExpress) */
    _baseDirectory?: string;
}

/**
 * Response object returned by Appwrite runtime response methods
 */
export interface AppwriteResponseObject {
    body:
        | Buffer
        | string
        | Record<string, unknown>
        | Promise<Buffer | string | Record<string, unknown>>;
    statusCode: number;
    headers: Record<string, string | number | boolean>;
}

/**
 * The context provided by the executed Appwrite Function
 */
export interface AppwriteContext {
    /** The request object */
    req: AppwriteRequest;
    /** The response object */
    res: AppwriteResponse;
    /** Function to log debug messages */
    log: (...messages: unknown[]) => void;
    /** Function to log error messages */
    error: (...messages: unknown[]) => void;
}

/**
 * Forward declaration for AppExpress classes
 */
export interface AppExpressRequest {
    readonly bodyRaw: string | undefined;
    readonly bodyText: string | undefined;
    readonly body: Record<string, unknown>;
    readonly bodyJson: Record<string, unknown>;
    readonly bodyBinary: Buffer;
    readonly headers: Record<string, string>;
    readonly scheme: string;
    readonly method: string;
    readonly url: string;
    readonly host: string;
    readonly port: number;
    readonly path: string;
    readonly queryString: string;
    readonly params: Record<string, string>;
    readonly query: Record<string, string>;
    readonly triggeredType: 'event' | 'http' | 'schedule';
    readonly events: Record<string, string> | undefined;
    readonly eventType: string | undefined;
    retrieve<T>(type: new (...args: unknown[]) => T, identifier?: string): T;
    dump(): string;
}

export interface AppExpressResponse {
    setHeaders(headers: Record<string, string | number | boolean>): void;
    clearHeaders(): void;
    empty(): void;
    json(data: unknown, statusCode?: number): void;
    redirect(url: string): void;
    text(content: unknown, statusCode?: number, contentType?: string): void;
    send(content: unknown, statusCode?: number, contentType?: string): void;
    binary(
        contentOrPath: Buffer | string,
        statusCode?: number,
        contentType?: string,
    ): void;
    render(
        filePath: string,
        options?: Record<string, unknown>,
        statusCode?: number,
    ): void;
}

/**
 * Represents a function that handles AppExpress requests
 */
export type AppExpressRequestHandler = (
    request: AppExpressRequest,
    response: AppExpressResponse,
    log: (...messages: unknown[]) => void,
    error: (...messages: unknown[]) => void,
) => unknown;

/**
 * Represents a function that allows intercepting, modifying or updating AppExpress responses
 */
export interface AppExpressResponseInterceptor {
    /** The processed response body. Note: The contents of the body are not compressed yet. */
    body:
        | string
        | Buffer
        | Record<string, unknown>
        | Promise<string | Buffer | Record<string, unknown>>;
    /** The statusCode of the response. */
    statusCode: number;
    /** The headers added to the response. */
    headers: Record<string, string | number | boolean>;
}

/**
 * Represents a function that intercepts or modifies or updates AppExpress responses
 */
export type AppExpressResponseHandler = (
    request: AppExpressRequest,
    body: AppExpressResponseInterceptor,
    log: (...messages: unknown[]) => void,
    error: (...messages: unknown[]) => void,
) => void | Promise<void>;

/**
 * Manages and tracks dependency injections, mapping unique identifiers to their respective instances and types
 */
export type InjectionRegistry = Map<
    string,
    { type: Function; instance: unknown }
>;

/**
 * Represents a function that allows a user to use a custom compression for HTTP responses
 */
export interface CompressionHandler {
    /** The list of encodings that the handler supports */
    encodings: Set<string>;
    /** Function to compress data */
    compress: (
        buffer: Buffer,
        log: (...messages: unknown[]) => void,
        error: (...messages: unknown[]) => void,
    ) => Promise<Buffer> | Buffer;
}

/**
 * Stores Maps of URL paths to handler functions for different HTTP request methods
 */
export interface AppExpressRequestMethods {
    /** Map for GET request handlers */
    get: Map<string, AppExpressRequestHandler>;
    /** Map for POST request handlers */
    post: Map<string, AppExpressRequestHandler>;
    /** Map for PUT request handlers */
    put: Map<string, AppExpressRequestHandler>;
    /** Map for PATCH request handlers */
    patch: Map<string, AppExpressRequestHandler>;
    /** Map for DELETE request handlers */
    delete: Map<string, AppExpressRequestHandler>;
    /** Map for OPTIONS request handlers */
    options: Map<string, AppExpressRequestHandler>;
    /** Map for handlers that apply to ALL request methods */
    all: Map<string, AppExpressRequestHandler>;
}

/**
 * Stores a file extension and an engine's function call to render content
 */
export type AppExpressViewEngineHandler = Map<
    string,
    (
        filePath: string,
        options: Record<string, unknown>,
        callback: (error: Error | null, content?: string) => void,
    ) => void
>;
