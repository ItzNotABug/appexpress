import { requestMethods } from './types/misc.js';
import AppExpressRequest from './types/request.js';
import AppExpressResponse from './types/response.js';

/**
 * An `express.js` like framework for Appwrite Functions, enabling super-easy navigation!
 */
class AppExpress {
    /**
     * Represents a Router for handling HTTP requests.
     */
    static Router = class {
        constructor() {
            /** @type boolean */
            this._empty = true;

            /** @type RequestMethods */
            this._internalRoutes = requestMethods();
        }

        /**
         * Registers a `GET` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        get(path, handler) {
            this._internalRoutes.get.set(path, handler);
            if (this._empty) this._empty = false;
        }

        /**
         * Registers a `POST` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        post(path, handler) {
            this._internalRoutes.post.set(path, handler);
            if (this._empty) this._empty = false;
        }

        /**
         * Registers a `PUT` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        put(path, handler) {
            this._internalRoutes.put.set(path, handler);
            if (this._empty) this._empty = false;
        }

        /**
         * Registers a `PATCH` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        patch(path, handler) {
            this._internalRoutes.patch.set(path, handler);
            if (this._empty) this._empty = false;
        }

        /**
         * Registers a `DELETE` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        delete(path, handler) {
            this._internalRoutes.delete.set(path, handler);
            if (this._empty) this._empty = false;
        }

        /**
         * Registers a `OPTIONS` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        options(path, handler) {
            this._internalRoutes.options.set(path, handler);
            if (this._empty) this._empty = false;
        }

        /**
         * Register a handler for `ALL` routes.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        all(path, handler) {
            this._internalRoutes.all.set(path, handler);
            if (this._empty) this._empty = false;
        }
    };

    constructor() {
        /** @type {RequestHandler[]} */
        this._middlewares = [];

        /** @type {InjectionRegistry} */
        this._dependencies = new Map();

        /** @type string */
        this._viewsDirectory = '';

        /** @type RequestMethods */
        this._routes = requestMethods();
    }

    /**
     * Register a custom middleware.
     *
     * **Note**: `request.params` are not available to middlewares due to no `pattern` awareness.
     *
     * @param {RequestHandler} middleware - The middleware/request handler to add to the chain.
     *
     * @example
     * ```javascript
     * appExpress.middleware((request, response, log, error) => {
     *      // do something with `request` object.
     *
     *     log('this is a debug log');
     *     error('this is an error log');
     *
     *     // throw an Error here to exit the middleware chain.
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
     *
     *     response.send('logged') // this will exit the function.
     * };
     *
     * appExpress.middleware(loggingMiddleware);
     * ```
     */
    middleware(middleware) {
        this._middlewares.push(middleware);
    }

    /**
     * Registers a `Router` for a given path.
     *
     * @param {string} path - The base URL path.
     * @param {AppExpress.Router} router - The router that handles the extending paths.
     * @throws {Error} - If the router does not have any handlers.
     * @see {AppExpress.Router}
     */
    use(path, router) {
        if (router._empty) {
            throw new Error(`No routes defined for path '${path}'.`);
        }

        for (const method in router._internalRoutes) {
            router._internalRoutes[method].forEach((handler, route) => {
                const fullPath = this.#normalizePath(path, route);
                this._routes[method].set(fullPath, handler);
            });
        }
    }

    /**
     * Registers a `GET` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    get(path, handler) {
        this._routes.get.set(path, handler);
    }

    /**
     * Registers a `POST` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    post(path, handler) {
        this._routes.post.set(path, handler);
    }

    /**
     * Registers a `PUT` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    put(path, handler) {
        this._routes.put.set(path, handler);
    }

    /**
     * Registers a `PATCH` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    patch(path, handler) {
        this._routes.patch.set(path, handler);
    }

    /**
     * Registers a `DELETE` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    delete(path, handler) {
        this._routes.delete.set(path, handler);
    }

    /**
     * Registers a `OPTIONS` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    options(path, handler) {
        this._routes.options.set(path, handler);
    }

    /**
     * Register a handler for `ALL` routes.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    all(path, handler) {
        this._routes.all.set(path, handler);
    }

    /**
     * Cache an instance to access it later via `AppExpressRequest#retrieve()`.\
     * Useful when you have to pass a class instance around the application.
     *
     * @param {any} object - The instance to inject.
     * @param {string} identifier='' - An optional identifier for the instance.
     * @throws {Error} - If an instance already exists.
     */
    inject(object, identifier = '') {
        const objectType = object.constructor;
        const objectName = objectType.name;
        const key = identifier ? `${objectName}:${identifier}` : objectName;

        if (this._dependencies.has(key)) {
            if (identifier) {
                throw new Error(
                    `An instance of '${objectName}' with identifier '${identifier}' is already injected.`,
                );
            } else {
                throw new Error(
                    `An instance of '${objectName}' is already injected.`,
                );
            }
        }

        this._dependencies.set(key, { type: objectType, instance: object });
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
        this._context = context;

        // build the request and response.
        const request = new AppExpressRequest(context);
        const response = new AppExpressResponse(context);

        // add the injections.
        context.req.dependencies = this._dependencies;
        if (this._viewsDirectory) context.res.views = this._viewsDirectory;

        // find the route...
        const method = request.method;
        let routeHandler = this._routes[method].get(request.path);

        if (!routeHandler) {
            for (const [path, handler] of this._routes[method]) {
                // Skip wildcard during matching.
                if (path === '*') continue;

                const regexPattern = path
                    .replace(/:\w+/g, '([^/]+)')
                    .replace(/\*/g, '.*');

                const regex = new RegExp('^' + regexPattern + '$');
                const match = request.path.match(regex);

                if (match) {
                    const keys = path.match(/:\w+/g);
                    if (keys) {
                        this.#extractParamsFromRoute(request.path, path);
                    }

                    routeHandler = handler;
                    break;
                }
            }
        }

        if (!routeHandler) {
            for (const [path, handler] of this._routes.all) {
                const regexPattern = path
                    .replace(/:\w+/g, '([^/]+)')
                    .replace(/\*/g, '.*');

                const regex = new RegExp('^' + regexPattern + '$');
                if (regex.test(request.path)) {
                    routeHandler = handler;
                }
            }
        }

        if (!routeHandler) {
            routeHandler = this._routes[method].get('*');
            // can this ever be a use-case? IDK.
            if (!routeHandler) routeHandler = this._routes.all.get('*');
        }

        // execute the middlewares.
        for (const middleware of this._middlewares) {
            // allowing middlewares to return things,
            // example: a favicon handler or an auth check middleware.
            await middleware(request, response, context.log, context.error);

            // a middleware might return something.
            if (this.#contextHasReturn()) break;
        }

        if (this.#contextHasReturn()) {
            // a middleware indeed returned something.
            return this.#processHandlerResult(request, response);
        }

        if (routeHandler) {
            // execute the route handler.
            await routeHandler(request, response, context.log, context.error);

            return this.#processHandlerResult(request, response);
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
     * @param {string} requestPath - The request path. Example : `/users/a4d3b4a80`
     * @param {string} routePathPattern - The pattern of the path intended for extraction. Example : `/users/:id`
     */
    #extractParamsFromRoute(requestPath, routePathPattern) {
        const pathParts = requestPath.split('/').filter((part) => part.length);
        const patternParts = routePathPattern
            .split('/')
            .filter((part) => part.length);

        if (patternParts.length !== pathParts.length) return;

        // default empty list.
        this._context.req.params = {};

        for (let index = 0; index < patternParts.length; index++) {
            if (patternParts[index].startsWith(':')) {
                const paramName = patternParts[index].substring(1);
                this._context.req.params[paramName] = pathParts[index];
            }
        }
    }

    /**
     * Clears the dependency if any was injected.
     */
    #clearDependencies() {
        this._dependencies.length = 0;
        this._context.req.dependencies.length = 0;
    }

    /**
     * Combines and normalizes the basePath and route into a clean URL path.
     *
     * @param {string} basePath - The base part of the URL path.
     * @param {string} route - The route segment to be appended to the base path.
     * @returns {string} The normalized URL path.
     */
    #normalizePath(basePath, route) {
        let fullPath = `${basePath}/${route}`.replace(/\/+/g, '/');

        if (fullPath.endsWith('/') && fullPath.length > 1) {
            fullPath = fullPath.slice(0, -1);
        }
        return fullPath;
    }

    /**
     * Check if the appwrite context has the dynamic return.
     *
     * @returns {boolean}
     */
    #contextHasReturn() {
        const context = this._context;
        return (
            context.res.dynamic !== null && context.res.dynamic !== undefined
        );
    }

    /**
     * Handles the result from either the middleware or the router handler.
     *
     * @param {AppExpressRequest} request
     * @param {AppExpressResponse} response
     * @returns {*} The result from the `routeHandlerResult`.
     */
    #processHandlerResult(request, response) {
        // clear the dependencies.
        this.#clearDependencies();

        if (this.#contextHasReturn()) {
            return this._context.res.dynamic; // allow `response.empty()`
        } else {
            // for console executions.
            this._context.error(
                `Invalid return from route ${request.path}. Use 'response.empty()' if no response is expected.`,
            );

            // return as per original implementation,
            // open-runtimes > node* > src > server.js
            return response.send('', 500);
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
