/** Misc file for type declarations. */

/**
 * @typedef {Object} AppwriteFunctionContext.
 * @description The context provided by the executed `Appwrite Function`.
 *
 * @property {Object} req - The request object, encapsulating details such as headers, method, and body.
 * @property {Object} res - The response object, used for sending data back to the client.
 * @property {function(string): void} log - Function to log debug messages.
 * @property {function(string): void} error - Function to log error messages.
 */

/**
 * @typedef {function(req: AppExpressRequest, res: AppExpressResponse, log: function(string): void, error: function(string): void): Promise<any>} RequestHandler
 * @description Represents a function that handles requests. It accepts a request object, a response object, and two logging functions (for logging and errors).
 */
