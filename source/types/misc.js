/** Misc file for type declarations. */

/**
 * @typedef {Object} AppwriteFunctionContext.
 * @description The context provided by the executed `Appwrite Function`.
 *
 * @property {Object} req - The request object, encapsulating details such as headers, method, and body.
 * @property {Object} res - The response object, used for sending data back to the client.
 * @property {(message: string) => void} log - Function to log debug messages.
 * @property {(error: string) => void} error - Function to log error messages.
 */

/**
 * @typedef {(request: AppExpressRequest, response: AppExpressResponse, log: function(string): void, error: function(string): void) => any} RequestHandler
 * @description Represents a function that handles requests. It accepts a request object, a response object, and two logging functions (for logging and errors).
 */

/**
 * @typedef {Object} ResponseInterceptor
 * @description Represents a function that allows intercepting, modifying or updating responses.
 *
 * @property {string|Buffer|object} body - The processed response body.\
 * **Note**: The contents of the body are not compressed yet.
 * @property {number} statusCode - The statusCode of the response.
 * @property {Object<string, string|number>} headers - The headers added to the response.
 */

/**
 * @typedef {(request: AppExpressRequest, body: ResponseInterceptor, log: function(string): void, error: function(string): void) => void} ResponseHandler
 * @description Represents a function that intercepts or modifies or updates responses. It accepts a request object, a response interceptor object, and two logging functions (for logging and errors).
 */

/**
 * @typedef {Map<string, {type: Function, instance: any}>} InjectionRegistry
 * @description Manages and tracks dependency injections, mapping unique identifiers to their respective instances and types.
 */

/**
 * @typedef {Object} CompressionHandler
 * @description Represents a function that allows a user to use a custom compression for HTTP responses.
 *
 * @property {Set<string>} encodings - The list of encodings that the handler supports.
 * @property {(buffer: Buffer, log: (message: string) => void, error: (error: string) => void) => Promise<Buffer>|Buffer} compress - Function to compress data.
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
 * @typedef {Map<string, engine: any>} ViewEngineHandler
 * @description Stores a file extension and an engine's function call to render content.
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

/**
 * Returns a function that checks if a given content type is compressible.
 *
 * @returns {boolean} Returns true if the content type is compressible.
 */
export const isCompressible = (contentType) => {
    const contentTypePatterns = [
        /^text\/(html|css|plain|xml|x-component|javascript)$/i,
        /^application\/(x-javascript|javascript|json|manifest\+json|vnd\.api\+json|xml|xhtml\+xml|rss\+xml|atom\+xml|vnd\.ms-fontobject|x-font-ttf|x-font-opentype|x-font-truetype)$/i,
        /^image\/(svg\+xml|x-icon|vnd\.microsoft\.icon)$/i,
        /^font\/(ttf|eot|otf|opentype)$/i,
    ];

    for (const pattern of contentTypePatterns) {
        if (pattern.test(contentType)) return true;
    }

    return false;
};
