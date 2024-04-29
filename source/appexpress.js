// noinspection JSUnusedGlobalSymbols

import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
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
        this._views = '';

        /** @type RequestMethods */
        this._routes = requestMethods();

        /** @type ViewEngineHandler */
        this._engine = new Map();

        /**
         * The base directory inside the docker container where the function is run.\
         * See [here](https://github.com/open-runtimes/open-runtimes/blob/16bf063b60f1f2a150b6caa9afdd2d1786e7ca35/runtimes/node-18.0/src/server.js#L6) how the exact path is derived.
         *
         * @type string
         */
        this.baseDirectory = './src/function';
    }

    /**
     * Set a custom view engine.\
     * Out of the box supported engines are - `ejs`, `express-hbs`, `hbs` & `pug`.
     *
     * You can create a custom engine too!
     *
     * Define Engine:
     * ```javascript
     * import fs from 'fs';
     *
     * // set views directory
     * appExpress.views('views')
     *
     * appExpress.engine('ntl', (filePath, options, callback) => {
     *   fs.readFile(filePath, (err, content) => {
     *     if (err) return callback(err)
     *
     *     const rendered = content.toString()
     *       .replace('#title#', `<title>${options.title}</title>`);
     *       // or use a regex to filter content pattern.
     *     return callback(null, rendered)
     *   })
     * })
     * ```
     *
     * Template file (`index.ntl`):
     * ```
     * <h1>#title#</h1>
     * ```
     *
     * Usage:
     *```javascript
     * app.get('/', (req, res) => {
     *   res.render('index', { title: 'AppExpress' })
     * })
     * ```
     *
     * @param {string} ext - The file extension for the engine.
     * @param {any} engine - The view engine that will be used for rendering content.
     */
    engine(ext, engine) {
        // `hbs`, `ejs`, `pug` have this variable,
        // that is handled by express internally.
        if (engine.hasOwnProperty('__express')) {
            this._engine.set(ext, engine.__express);
        } else if (typeof engine === 'function') {
            // `express-hbs` uses 4 params,
            // but adjusts to 3 dynamically.
            if (engine.length >= 3) this._engine.set(ext, engine);
            else {
                throw new Error(
                    `Your custom engine function must have exactly 3 methods (filePath, options, callback(error, content). Current length: ${engine.length}`,
                );
            }
        } else {
            throw new Error(
                'This view engine may be unsupported as it seems to be missing the function required to render content.',
            );
        }
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
        this._views = directory;
    }

    /**
     * Specify a path where your publicly accessible files are located.\
     * Requests made to these files are handled via a `middleware` and are directly served.
     *
     * To use multiple static assets directories, you can call this function multiple times :
     * ```javascript
     * appExpress.public('public');
     *
     *  // exclude some files via name or RegExp.
     * appExpress.public('files', ['.env', /config/g]);
     * ```
     *
     * **Note**: The default encoding is `text/plain` if no or unknown extension is found for a file.
     *
     * @param {string} directory='' - The directory path containing the public files.
     * @param {(string|RegExp)[]} [exclude=[]] - The directory path containing the public files.
     */
    public(directory = '', exclude = []) {
        if (directory) {
            const defType = 'text/plain';
            const filesMapping = this.#processDirectory(directory, exclude);

            this.middleware((request, response) => {
                const requestedFile = filesMapping[request.path];
                if (requestedFile) {
                    const options = {};
                    const contentType = mime.lookup(requestedFile) || defType;

                    if (
                        contentType.startsWith('text/') ||
                        contentType === 'application/json'
                    )
                        options.encoding = 'utf8';

                    const fileContent = fs.readFileSync(requestedFile, options);
                    response.send(fileContent, 200, contentType);
                }
            });
        }
    }

    /**
     * Reads a given directory and builds file mappings.
     *
     * @param {string} directory - The directory to read.
     * @param {(string|RegExp)[]} exclude - Name or regex pattern to exclude files,
     * @returns {{}}
     */
    #processDirectory(directory, exclude) {
        let filesMapping = {};
        let directoryStack = [path.join(this.baseDirectory, directory)];

        while (directoryStack.length) {
            const currentPath = directoryStack.pop();
            const contents = fs.readdirSync(currentPath, {
                withFileTypes: true,
            });

            for (const content of contents) {
                const contentName = content.name;
                if (
                    exclude.some((pattern) =>
                        typeof pattern === 'string'
                            ? contentName === pattern
                            : pattern.test(contentName),
                    )
                ) {
                    continue;
                }

                const fullPath = path.join(currentPath, content.name);

                if (content.isDirectory()) {
                    directoryStack.push(fullPath);
                } else if (content.isFile()) {
                    let relativePath = `/${path.relative(this.baseDirectory, fullPath)}`;
                    relativePath = relativePath.replace(`/${directory}`, '');
                    filesMapping[relativePath] = fullPath;
                }
            }
        }

        return filesMapping;
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

        // setup response handler.
        context.req.dependencies = this._dependencies;
        context.res._baseDirectory = this.baseDirectory;
        if (this._views) context.res._views = this._views;
        if (this._engine.size) context.res._engine = this._engine;

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
            return await this.#processHandlerResult();
        }

        if (routeHandler) {
            // execute the route handler.
            await routeHandler(request, response, context.log, context.error);

            return await this.#processHandlerResult();
        } else {
            // mimic express.js and return a similar error.
            return this.#sendErrorResult(
                `Cannot ${request.method.toUpperCase()} '${request.path}'.`,
            );
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
     * @returns {*} The result from the `routeHandlerResult`.
     */
    async #processHandlerResult() {
        // clear the dependencies.
        this.#clearDependencies();

        if (this.#contextHasReturn()) {
            const response = this._context.res;
            const result = response.dynamic;

            /**
             * So what is happening here?
             *
             * Well, to allow a user directly call `render` without `await`,
             * we save the `Promise` in the body and send it here for completion.
             */
            if (response.promise) {
                try {
                    result.body = await result.body;
                    return result;
                } catch (error) {
                    return this.#sendErrorResult(
                        `Error rendering a view, ${error}`,
                    );
                }
            } else {
                return result;
            }
        } else {
            const request = this._context.req;
            return this.#sendErrorResult(
                `Invalid return from route ${request.path}. Use 'response.empty()' if no response is expected.`,
            );
        }
    }

    /**
     * Return an error result to source.
     *
     * @param {string} error - The error message.
     * @returns {*} The result to be sent back to source.
     */
    #sendErrorResult(error) {
        // for console executions.
        this._context.error(error);

        // return as per original implementation,
        // open-runtimes > node* > src > server.js
        return this._context.res.send(error, 500, {
            'content-type': 'text/plain',
        });
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
