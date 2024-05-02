const METHODS = {
    GET: 'GET',
    POST: 'POST',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
    OPTIONS: 'OPTIONS',
};

const HOMEPAGE_SUBPATHS = ['/robots.txt', '/favicon.ico'];

function addIfNotEmpty(target, key, value) {
    if (value && Object.keys(value).length > 0) {
        target[key] = value;
    }
}

function createRoute(methods, options = {}) {
    const route = { methods: methods };

    addIfNotEmpty(route, 'body', options.body);
    addIfNotEmpty(route, 'query', options.query);
    addIfNotEmpty(route, 'params', options.params);
    addIfNotEmpty(route, 'subPaths', options.subPaths);

    return route;
}

export const registeredRoutes = {
    '/': createRoute([METHODS.GET], {
        subPaths: HOMEPAGE_SUBPATHS,
        query: {
            type: 'string',
            acceptable: ['md', 'ejs', 'hbs', 'pug', 'html', 'string'],
        },
    }),
    '/all': createRoute([
        METHODS.GET,
        METHODS.POST,
        METHODS.PATCH,
        METHODS.DELETE,
        METHODS.OPTIONS,
    ]),
    '/console': createRoute([METHODS.GET], {
        body: { userJwtToken: 'string' },
    }),
    '/dump': createRoute([METHODS.GET]),
    '/empty': createRoute([METHODS.GET]),
    '/health': createRoute([METHODS.GET]),
    '/ping': createRoute([METHODS.GET]),
    '/pong': createRoute([METHODS.POST]),
    '/redirect': createRoute([METHODS.GET], {
        query: { redirect_url: 'string' },
    }),
    '/users/:id/:transaction': createRoute([METHODS.GET], {
        params: { id: 'string', transaction: 'string' },
    }),
    '/versions': createRoute([METHODS.GET]),
};

console.log(JSON.stringify(registeredRoutes, null, 2));
