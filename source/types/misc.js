/** Misc file for type declarations. */

/**
 * @typedef {Object} AppwriteFunctionContext.
 * @description The context provided by the executed `Appwrite Function`.
 *
 * @property {Object} req - The request object, encapsulating details such as headers, method, and body.
 * @property {Object} res - The response object, used for sending data back to the client.
 * @property {function(message: string): void} log - Function to log debug messages.
 * @property {function(error: string): void} error - Function to log error messages.
 */

/**
 * @typedef {function(request: AppExpressRequest, response: AppExpressResponse, log: function(string): void, error: function(string): void): any} RequestHandler
 * @description Represents a function that handles requests. It accepts a request object, a response object, and two logging functions (for logging and errors).
 */

/**
 * @typedef {function(request: AppExpressRequest, log: function(string): void, error: function(string): void): any} MiddlewareHandler
 * @description Represents a function that handles requests. It accepts a request object, and two logging functions (for logging and errors).
 */

/**
 * @typedef {Map<string, {type: Function, instance: any}>} InjectionRegistry
 * @description Manages and tracks dependency injections, mapping unique identifiers to their respective instances and types.
 */

/**
 * @typedef {Object} RequestMethods
 * @description Stores Maps of URL paths to handler functions for different HTTP request methods.
 *
 * @property {Map<string, RequestHandler>} get - Map for `GET` request handlers.
 * @property {Map<string, RequestHandler>} post - Map for `POST` request handlers.
 * @property {Map<string, RequestHandler>} put - Map for `PUT` request handlers.
 * @property {Map<string, RequestHandler>} patch - Map for `PATCH` request handlers.
 * @property {Map<string, RequestHandler>} delete - Map for `DELETE` request handlers.
 * @property {Map<string, RequestHandler>} options - Map for `OPTIONS` request handlers.
 * @property {Map<string, RequestHandler>} all - Map for handlers that apply to `ALL` request methods.
 */

/**
 * Creates and returns a new set of request method maps.
 *
 * @returns {RequestMethods} A new instance of request method maps for routing.
 */
export function requestMethods() {
    return {
        get: new Map(),
        post: new Map(),
        put: new Map(),
        patch: new Map(),
        delete: new Map(),
        options: new Map(),
        all: new Map(),
    };
}
