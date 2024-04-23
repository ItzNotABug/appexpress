import path from 'path';
import fs from 'fs/promises';

/**
 * Represents the response object for returning, exiting the function.
 */
class AppExpressResponse {
    /**
     * Initializes a new instance of the `AppExpressResponse` class.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     */
    constructor(context) {
        this._context = context;
        this._response = context.res;
    }

    /**
     * Send an empty response,\
     * typically used when there's no need to send back any data to the source.
     */
    empty() {
        return this.#wrapReturnForSafety(this._response.empty());
    }

    /**
     * Send a JSON response back to the source.
     *
     * @param {Object} data - The JSON data to send.
     */
    json(data) {
        return this.#wrapReturnForSafety(this._response.json(data));
    }

    /**
     * Redirect to a specified URL.
     *
     * @param {string} url - The URL to redirect to.
     */
    redirect(url) {
        return this.#wrapReturnForSafety(this._response.redirect(url));
    }

    /**
     * Send a response with a specific content type and status code.
     *
     * @param {string} string - The response body to send.
     * @param {number} statusCode=200 - The HTTP status code.
     * @param {string} contentType='text/plain' - The content type of the response.
     */
    send(string, statusCode = 200, contentType = 'text/plain') {
        return this.#wrapReturnForSafety(
            this._response.send(string, statusCode, {
                'content-type': contentType,
            }),
        );
    }

    /**
     * Send an HTML response back to the source which is rendered for the user.
     *
     * @param {string} stringHtml - The HTML string to send.
     * @param {number} statusCode=200 - The HTTP status code.
     */
    html(stringHtml, statusCode = 200) {
        return this.send(stringHtml, statusCode, 'text/html');
    }

    /**
     * Send HTML content from a file as a response back to the source which is rendered for the user.
     *
     * @param {string} filePath - The file path to read HTML from.
     * @param {number} statusCode=200 - The HTTP status code to send.
     * @returns {Promise<*>} - A promise that resolves when the file has been sent.
     */
    async htmlFromFile(filePath, statusCode = 200) {
        try {
            const fullPath = this._response.views
                ? `${this._response.views}/${filePath}`
                : `${filePath}`;

            /**
             * afaik, the current directory is always `server`.\
             * See [here](https://github.com/open-runtimes/open-runtimes/blob/16bf063b60f1f2a150b6caa9afdd2d1786e7ca35/runtimes/node-18.0/src/server.js#L6) how the exact path is derived.
             *
             * @type {string}
             */
            const usablePath = path.join(
                process.cwd(),
                `./src/function/${fullPath}`,
            );
            const htmlContent = await fs.readFile(usablePath, 'utf8');
            return this.html(htmlContent, statusCode);
        } catch (error) {
            this._context.error(`Failed to read HTML file: ${error}`);
            return this.send('Internal Server Error', 500, 'text/plain');
        }
    }

    /**
     * Wrap the return value for safety.
     *
     * This is helpful if the developer ever forgets to use `return` in the `RequestHandler`.
     *
     * @param {any} data - The data to wrap for safety.
     * @returns {data} - The same data but safely wrapped in a dynamic variable.
     */
    #wrapReturnForSafety(data) {
        this._response.dynamic = data;
        return this._response.dynamic;
    }
}

export default AppExpressResponse;
