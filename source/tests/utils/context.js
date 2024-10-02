/**
 * Creates a context with predefined HTTP request and response handlers.
 *
 * @param {string} method='get' - HTTP method of the request.
 * @param {string} path='/' - Path for the HTTP request.
 * @param {Object} headers={} - Headers for the HTTP request.
 * @param {{}} requestOptions - Additional properties to be included in the request.
 * @returns {Object} Returns a context object containing request data, response handlers, and logging functions.
 */
export const createContext = ({
    method = 'get',
    path = '/',
    headers = {},
    ...requestOptions
} = {}) => {
    return {
        req: {
            method,
            path,
            headers,
            ...requestOptions,
        },

        /**
         * As per [server.js](https://github.com/open-runtimes/open-runtimes/blob/16bf063b60f1f2a150b6caa9afdd2d1786e7ca35/runtimes/node-18.0/src/server.js#L87C9-L106C11),
         * all methods except `empty()` support `statusCode` & `headers` but they are managed internally.
         */
        res: {
            text: function (body, statusCode = 200, headers = {}) {
                // open-runtimes uses below logic, but it fails our tests -
                // return this.binary(Buffer.from(body, "utf8"), statusCode, headers);
                return {
                    body: body,
                    statusCode: statusCode,
                    headers: headers,
                };
            },
            binary: function (bytes, statusCode = 200, headers = {}) {
                return {
                    body: bytes,
                    statusCode: statusCode,
                    headers: headers,
                };
            },
            /**
             * @deprecated Use `text` instead.
             */
            send: function (body, statusCode = 200, headers = {}) {
                return {
                    body: body,
                    statusCode: statusCode,
                    headers: headers,
                };
            },
            json: function (object, statusCode = 200, headers = {}) {
                /**
                 * `server.js` uses `JSON.stringify(object)`
                 * along with application/json as content-type.
                 *
                 * We can't do that so just send the object as is.
                 */
                return this.send(object, statusCode, headers);
            },
            empty: function () {
                return this.send('', 204, {});
            },
            redirect: function (url, statusCode = 301, headers = {}) {
                return this.send(url, statusCode, headers);
            },
        },
        log: (_) => '', // empty for the sake of testing
        error: (_) => '', // empty for the sake of testing
    };
};
