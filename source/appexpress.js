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
        /** @type {Array<(req: AppExpressRequest, res: AppExpressResponse, log: function(string) : void, error: function(string): void) => Promise<void>>} */
        this._middlewares = [];

        /** @type {Array<{type: Function, id: string, instance: any}>} */
        this._dependencies = [];

        /** @type string */
        this._viewsDirectory = '';

        /** @type RequestMethods */
        this._routes = requestMethods();
    }

    /**
     * Register a custom middleware.
     *
     * @param {RequestHandler} middleware - The middleware function to add to the chain.
     *
     * @example
     * ```javascript
     * appExpress.middleware((request, response, log, error) => {
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
                    if (keys)
                        this.#extractParamsFromRoute(
                            context,
                            request.path,
                            path,
                        );

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

        if (routeHandler) {
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
            const routeHandlerResult = await routeHandler(
                request,
                response,
                context.log,
                context.error,
            );

            // clear the dependencies.
            this.#clearDependencies(context);

            return routeHandlerResult;
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
     * Clears the dependency if any was injected.
     *
     * @param {AppwriteFunctionContext} context
     */
    #clearDependencies(context) {
        this._dependencies.length = 0;
        context.req.dependencies.length = 0;
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
     * Attach the AppExpress instance.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     */
    async attach(context) {
        return await this.#handleRequest(context);
    }
}

export default AppExpress;
