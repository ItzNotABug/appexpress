import AppExpressRequest from './types/request.js';
import AppExpressResponse from './types/response.js';

/**
 * An `express.js` like framework for Appwrite Functions, enabling super-easy navigation!
 */
class AppExpress {
    constructor() {
        /** @type {Array<(req: AppExpressRequest, res: AppExpressResponse, log: function(string) : void, error: function(string): void) => Promise<void>>} */
        this._middlewares = [];

        /** @type {Array<{type: Function, id: string, instance: any}>} */
        this._dependencies = [];

        this._viewsDirectory = '';

        this._routes = {
            get: [],
            post: [],
            put: [],
            patch: [],
            delete: [],
            options: [],
            all: [],
        };
    }

    /**
     * Register a custom middleware.
     *
     * @param {RequestHandler} middleware - The middleware function to add to the chain.
     *
     * @example
     * ```javascript
     * appExpress.use((request, response, log, error) => {
     *      // do something with `request` object.
     *
     *     log('this is a debug log');
     *     error('this is an error log');
     * });
     * ```
     *
     * @example
     * ```javascript
     * const loggingMiddleware = (request, response, log, error) => {
     *     // do something with `request` object.
     *
     *     log('this is a debug log');
     *     error('this is an error log');
     * };
     *
     * appExpress.use(loggingMiddleware);
     * ```
     */
    use(middleware) {
        this._middlewares.push(middleware);
    }

    /**
     * Registers a `GET` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    get(path, handler) {
        this._routes.get.push({ path, handler });
    }

    /**
     * Registers a `POST` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    post(path, handler) {
        this._routes.post.push({ path, handler });
    }

    /**
     * Registers a `PUT` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    put(path, handler) {
        this._routes.put.push({ path, handler });
    }

    /**
     * Registers a `PATCH` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    patch(path, handler) {
        this._routes.patch.push({ path, handler });
    }

    /**
     * Registers a `DELETE` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    delete(path, handler) {
        this._routes.delete.push({ path, handler });
    }

    /**
     * Registers a `OPTIONS` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    options(path, handler) {
        this._routes.options.push({ path, handler });
    }

    /**
     * Register a handler for `ALL` routes.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    all(path, handler) {
        this._routes.all.push({ path, handler });
    }

    /**
     * Cache an instance to access it later via `AppExpressRequest#retrieve()`.
     *
     * @param {any} object - The instance to inject.
     * @param {string} identifier='' - An optional identifier for the instance.
     * @throws {Error} - If an instance already exists.
     */
    inject(object, identifier = '') {
        const type = object.constructor;
        const key = identifier ? `${type.name}:${identifier}` : type.name;
        const exists = this._dependencies.some(
            (injection) =>
                (injection.id
                    ? `${injection.type.name}:${injection.id}`
                    : injection.type.name) === key,
        );

        if (exists) {
            if (identifier) {
                throw new Error(
                    `An instance of '${type.name}' with identifier '${identifier}' is already injected.`,
                );
            } else {
                throw new Error(
                    `An instance of '${type.name}' is already injected.`,
                );
            }
        }

        this._dependencies.push({ type, id: identifier, instance: object });
    }

    /**
     * Specify a path where your static html files are stored for rendering using `response.htmlFromFile()`.
     *
     * @param {string} directory='' - The directory path containing the html files.
     */
    views(directory = '') {
        this._viewsDirectory = directory;
    }

    /**
     * Handle incoming requests.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     */
    async #handleRequest(context) {
        // appwrite context.
        this.context = context;

        // build the request and response.
        const request = new AppExpressRequest(context);
        const response = new AppExpressResponse(context);

        // find the route...
        const method = request.method;
        let route = this._routes[method].find(
            (route) => route.path === request.path,
        );

        if (!route) {
            for (const indexerRoute of this._routes[method]) {
                // Skip wildcard during matching.
                if (indexerRoute.path === '*') continue;

                const regexPattern = indexerRoute.path
                    .replace(/:\w+/g, '([^/]+)')
                    .replace(/\*/g, '.*');

                const regex = new RegExp('^' + regexPattern + '$');
                const match = request.path.match(regex);

                if (match) {
                    const keys = indexerRoute.path.match(/:\w+/g);
                    if (keys)
                        this.#extractParamsFromRoute(
                            context,
                            request.path,
                            indexerRoute.path,
                        );
                    route = indexerRoute;
                    break;
                }
            }
        }

        if (!route) {
            route = this._routes.all.find((route) => {
                const regexPattern = route.path
                    .replace(/:\w+/g, '([^/]+)')
                    .replace(/\*/g, '.*');

                const regex = new RegExp('^' + regexPattern + '$');
                return regex.test(request.path);
            });
        }

        if (!route) {
            route = this._routes[method].find((route) => route.path === '*');
            // can this ever be a use-case? IDK.
            if (!route)
                route = this._routes.all.find((route) => route.path === '*');
        }

        if (route) {
            // add the injections.
            context.req.dependencies = this._dependencies;
            if (this._viewsDirectory) context.res.views = this._viewsDirectory;

            // execute the middlewares.
            if (this._middlewares.length > 0) {
                for (const middleware of this._middlewares) {
                    await middleware(
                        request,
                        response,
                        context.log,
                        context.error,
                    );
                }
            } else {
                // ignore, no middlewares.
            }

            // execute the route handler.
            const handlerResult = await route.handler(
                request,
                response,
                context.log,
                context.error,
            );

            // clear the dependencies.
            this._dependencies.length = 0;
            context.req.dependencies.length = 0;

            return handlerResult;
        } else {
            // mimic express.js and return a similar error.
            const errorMessage = `Cannot ${request.method.toUpperCase()} '${request.path}'.`;

            // for console executions.
            context.error(errorMessage);

            // return the error as body.
            return response.send(errorMessage, 404);
        }
    }

    /**
     * Extract dynamic params for the request.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     * @param {string} requestPath - The request path. Example : `/users/a4d3b4a80`
     * @param {string} routePathPattern - The pattern of the path intended for extraction. Example : `/users/:id`
     */
    #extractParamsFromRoute(context, requestPath, routePathPattern) {
        const pathParts = requestPath.split('/').filter((part) => part.length);
        const patternParts = routePathPattern
            .split('/')
            .filter((part) => part.length);

        if (patternParts.length !== pathParts.length) return;

        // default empty list.
        context.req.params = {};

        for (let index = 0; index < patternParts.length; index++) {
            if (patternParts[index].startsWith(':')) {
                const paramName = patternParts[index].substring(1);
                context.req.params[paramName] = pathParts[index];
            }
        }
    }

    /**
     * Attach the AppExpress instance.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     */
    async attach(context) {
        return await this.#handleRequest(context);
    }
}

export default AppExpress;
