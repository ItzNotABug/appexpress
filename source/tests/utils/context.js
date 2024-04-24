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
            empty: () => '',
            redirect: (url) => url,
            json: (object) => object,
            send: (body, statusCode, headers) => ({
                body,
                statusCode,
                headers,
            }),
        },
        log: (_) => '', // empty for the sake of testing
        error: (_) => '', // empty for the sake of testing
    };
};
