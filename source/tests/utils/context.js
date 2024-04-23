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
        res: {
            empty: () => '',
            redirect: (url) => url,
            json: (object) => object,
            send: (body, statusCode) => ({ body, statusCode }),
        },
        log: (_) => '', // empty for the sake of testing
        error: (_) => '', // empty for the sake of testing
    };
};
