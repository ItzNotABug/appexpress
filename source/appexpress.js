// noinspection JSUnusedGlobalSymbols

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import mime from 'mime-types';
import AppExpressRequest from './types/request.js';
import AppExpressResponse from './types/response.js';
import { isCompressible, requestMethods } from './types/misc.js';

/**
 * An `express.js` like framework for Appwrite Functions, enabling super-easy navigation!
 */
class AppExpress {
    /**
     * Represents a Router for handling HTTP requests.
     */
    static Router = class Router {
        /** @type boolean */
        #empty = true;

        /** @type RequestMethods */
        #internalRoutes = requestMethods();

        /**
         * Registers a `GET` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        get(path, handler) {
            this.#internalRoutes.get.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `POST` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        post(path, handler) {
            this.#internalRoutes.post.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `PUT` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        put(path, handler) {
            this.#internalRoutes.put.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `PATCH` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        patch(path, handler) {
            this.#internalRoutes.patch.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `DELETE` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        delete(path, handler) {
            this.#internalRoutes.delete.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `OPTIONS` route.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        options(path, handler) {
            this.#internalRoutes.options.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Register a handler for `ALL` routes.
         *
         * @param {string} path - The URL path.
         * @param {RequestHandler} handler - The handler to execute for the path.
         */
        all(path, handler) {
            this.#internalRoutes.all.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * This method is for accessing the built routes.\
         * **Note**: This API is not for public consumption.
         *
         * @returns {{empty: boolean, internalRoutes: RequestMethods}} The routes and their respective handlers.
         */
        read(accessor) {
            if (accessor instanceof AppExpress) {
                return {
                    empty: this.#empty,
                    internalRoutes: this.#internalRoutes,
                };
            }
        }

        /**
         * Sets the flag to not empty if at-least one route handler is added.\
         * The logic is to access the `emptiness` at fast path instead of checking all the methods in the RequestMethods.
         */
        #toggleEmpty() {
            if (this.#empty) this.#empty = false;
        }
    };

    /** @type AppwriteFunctionContext */
    #context;

    /** @type AppExpressRequest */
    #request;

    /** @type AppExpressResponse */
    #response;

    /** @type {{incoming: RequestHandler[], outgoing: ResponseHandler[]}} */
    #middlewares = { incoming: [], outgoing: [] };

    /** @type InjectionRegistry */
    #dependencies = new Map();

    /** @type string */
    #views = '';

    /** @type RequestMethods */
    #routes = requestMethods();

    /** @type ViewEngineHandler */
    #engine = new Map();

    /** @type boolean*/
    #showPoweredBy = true;

    /** @type {boolean|CompressionHandler} */
    #compression = true;

    /** @type {{br: number, deflate: number, gzip: number}}*/
    #compressionLevel = { br: 11, gzip: 6, deflate: 6 };

    /**
     * The base directory inside the docker container where the function is run.\
     * See [here](https://github.com/open-runtimes/open-runtimes/blob/16bf063b60f1f2a150b6caa9afdd2d1786e7ca35/runtimes/node-18.0/src/server.js#L6) how the exact path is derived.
     *
     * @type string
     */
    static get baseDirectory() {
        return './src/function';
    }

    constructor() {
        this.middleware({
            outgoing: (_, interceptor) => {
                this.#addPoweredByHeader(interceptor);
            },
        });
    }

    /**
     * Set a custom view engine.\
     * Out of the box supported engines are - `ejs`, `express-hbs`, `hbs` & `pug`.
     *
     * You can create a custom engine too! Define one like:
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
     * appExpress.get('/', (req, res) => {
     *   res.render('index', { title: 'AppExpress' })
     * })
     * ```
     *
     * @param {string|string[]} ext - The file extension[s] for the engine.
     * @param {any} engine - The view engine that will be used for rendering content.
     */
    engine(ext, engine) {
        // perform a quick validation!
        if (!Array.isArray(ext) && typeof ext !== 'string') {
            throw new Error(
                'The extension must be a string or an array of strings.',
            );
        }

        // construct an array for looping around...
        const extensions = Array.isArray(ext) ? ext : [ext];

        extensions.forEach((extension) => {
            // `hbs`, `ejs`, `pug` have this variable,
            // that is handled by express internally.
            if (engine.hasOwnProperty('__express')) {
                this.#engine.set(extension, engine.__express);
            } else if (typeof engine === 'function' && engine.length >= 3) {
                this.#engine.set(extension, engine);
            } else {
                throw new Error(
                    `Invalid engine: It must either have a '__express' property or be a function with at least 3 parameters. Received function length: ${engine.length}`,
                );
            }
        });
    }

    /**
     * Register a custom middleware.
     *
     * **Note**: `request.params` are not available to middlewares due to no `pattern` awareness.
     *
     * @param {RequestHandler|{incoming: RequestHandler|undefined, outgoing: ResponseHandler|undefined}} middleware - The middleware/request handler to add to the chain.
     * @example
     * ```javascript
     * appExpress.middleware((request, response, log, error) => {
     *   // do something with `request` object.
     *
     *   log('this is a debug log');
     *   error('this is an error log');
     *
     *   // throw an Error here to exit the middleware chain.
     * });
     * ```
     *
     * @example
     * ```javascript
     * appExpress.middleware({
     *   incoming: (request, response, log, error) => {
     *     // check request and response,
     *     // or even return response if you like.
     *   },
     *   outgoing: (request, interceptor, log, error) => {
     *     // you can modify the response here.
     *     // interceptor.body, interceptor.statusCode, interceptor.headers.
     *   }
     * });
     * ```
     */
    middleware(middleware) {
        // preserve the previous behaviour.
        if (typeof middleware === 'function') {
            this.#middlewares.incoming.push(middleware);
        } else if (typeof middleware === 'object') {
            const { incoming, outgoing } = middleware;
            if (incoming) this.#middlewares.incoming.push(incoming);
            if (outgoing) this.#middlewares.outgoing.push(outgoing);
        }
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
        const config = router.read(this);

        if (config.empty) {
            throw new Error(`No routes defined for path '${path}'.`);
        }

        for (const method in config.internalRoutes) {
            config.internalRoutes[method].forEach((handler, route) => {
                const fullPath = this.#normalizePath(path, route);
                this.#routes[method].set(fullPath, handler);
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
        this.#routes.get.set(path, handler);
    }

    /**
     * Registers a `POST` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    post(path, handler) {
        this.#routes.post.set(path, handler);
    }

    /**
     * Registers a `PUT` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    put(path, handler) {
        this.#routes.put.set(path, handler);
    }

    /**
     * Registers a `PATCH` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    patch(path, handler) {
        this.#routes.patch.set(path, handler);
    }

    /**
     * Registers a `DELETE` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    delete(path, handler) {
        this.#routes.delete.set(path, handler);
    }

    /**
     * Registers a `OPTIONS` route.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    options(path, handler) {
        this.#routes.options.set(path, handler);
    }

    /**
     * Register a handler for `ALL` routes.
     *
     * @param {string} path - The URL path.
     * @param {RequestHandler} handler - The handler to execute for the path.
     */
    all(path, handler) {
        this.#routes.all.set(path, handler);
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

        if (this.#dependencies.has(key)) {
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

        this.#dependencies.set(key, { type: objectType, instance: object });
    }

    /**
     * Specify a path where your views are stored for rendering.
     *
     * @param {string} directory='' - The directory path containing the views.
     */
    views(directory = '') {
        this.#views = directory;
    }

    /**
     * Specify a path where your static files are located for public access.\
     * Requests made to these files are handled via a `middleware` and are directly served.
     *
     * To use multiple static assets directories, you can call this function multiple times :
     * ```javascript
     * appExpress.static('public');
     *
     *  // exclude some files via name or RegExp.
     * appExpress.static('files', ['.env', /config/g]);
     * ```
     *
     * **Note**: The default encoding is `text/plain` if no or unknown extension is found for a file.
     *
     * @param {string} directory='' - The directory path containing the public files.
     * @param {(string|RegExp)[]} [exclude=[]] - The directory path containing the public files.
     */
    static(directory = '', exclude = []) {
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
                    ) {
                        options.encoding = 'utf8';
                    }

                    const fileContent = fs.readFileSync(requestedFile, options);
                    response.send(fileContent, 200, contentType);
                }
            });
        }
    }

    /**
     * Whether to add response header - `X-Powered-By: AppExpress`.\
     * If a custom value for the header is provided, it will be preserved.
     *
     * Enabled by default.
     *
     * @param {boolean} value - No header is added if you pass `false` or set your own header value.
     */
    poweredByHeader(value) {
        this.#showPoweredBy = value;
    }

    /**
     * Compress body content when sending responses back to the client.
     *
     * **Note**: Supported encodings are `br`, `gzip`, and `deflate`.
     * If the client supports multiple encodings, `br` is prioritized.
     *
     * Example for custom compression -
     * ```javascript
     * import zstd from '@mongodb-js/zstd';
     *
     * express.compression({
     *   encodings: new Set(['zstd']),
     *   compress: async (buffer) => {
     *       return await zstd.compress(buffer, 9);
     *   }
     * });
     * ```
     *
     * @param {boolean|CompressionHandler} value - Determines whether to enable compression, which is enabled by default, or to provide a custom compression handler.
     * @param {{br: number, deflate: number, gzip: number}} [options={ br: 11, gzip: 6, deflate: 6 }] - Specifies the compression levels for the supported encodings.
     */
    compression(value = true, options = { br: 11, gzip: 6, deflate: 6 }) {
        if (Object.keys(options).length !== 3) {
            throw new Error(
                'Please provide compression level options for all the supported encodings.',
            );
        }

        this.#compression = value;

        this.#validateCompression(options.br, 1, 11);
        this.#validateCompression(options.gzip, 1, 9);
        this.#validateCompression(options.deflate, 1, 9);

        this.#compressionLevel = options;
    }

    /**
     * Validate min and max compression levels for an encoding.
     */
    #validateCompression(encoding, min, max) {
        if (encoding < min || encoding > max) {
            throw new Error('Invalid compression level provided.');
        }
    }

    /**
     * Reads a given directory and builds file mappings.
     *
     * @param {string} directory - The directory to read.
     * @param {(string|RegExp)[]} exclude - Name or regex pattern to exclude files,
     * @returns {{}} An object containing file names as keys and their relative path as values for reads.
     */
    #processDirectory(directory, exclude) {
        let filesMapping = {};
        let directoryStack = [path.join(AppExpress.baseDirectory, directory)];

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
                    let relativePath = `/${path.relative(AppExpress.baseDirectory, fullPath)}`;
                    relativePath = relativePath.replace(`/${directory}`, '');
                    filesMapping[relativePath] = fullPath;
                }
            }
        }

        return filesMapping;
    }

    /**
     * Handle incoming requests.
     */
    async #handleRequest() {
        // build the request and response.
        this.#request = new AppExpressRequest(this.#context);
        this.#response = new AppExpressResponse(this.#context);

        // setup response handler.
        this.#context.req._dependencies = this.#dependencies;
        this.#context.res._baseDirectory = AppExpress.baseDirectory;

        if (this.#views) this.#context.res._views = this.#views;
        if (this.#engine.size) this.#context.res._engine = this.#engine;

        // find the route...
        const method = this.#request.method;
        let routeHandler = this.#routes[method].get(this.#request.path);

        if (!routeHandler) {
            for (const [path, handler] of this.#routes[method]) {
                // Skip wildcard during matching.
                if (path === '*') continue;

                const regexPattern = path
                    .replace(/:\w+/g, '([^/]+)')
                    .replace(/\*/g, '.*');

                const regex = new RegExp('^' + regexPattern + '$');
                const match = this.#request.path.match(regex);

                if (match) {
                    const keys = path.match(/:\w+/g);
                    if (keys) {
                        this.#extractParamsFromRoute(this.#request.path, path);
                    }

                    routeHandler = handler;
                    break;
                }
            }
        }

        if (!routeHandler) {
            for (const [path, handler] of this.#routes.all) {
                const regexPattern = path
                    .replace(/:\w+/g, '([^/]+)')
                    .replace(/\*/g, '.*');

                const regex = new RegExp('^' + regexPattern + '$');
                if (regex.test(this.#request.path)) {
                    routeHandler = handler;
                }
            }
        }

        if (!routeHandler) {
            routeHandler = this.#routes[method].get('*');
            // can this ever be a use-case? IDK.
            if (!routeHandler) routeHandler = this.#routes.all.get('*');
        }

        // execute the incoming middlewares.
        for (const middleware of this.#middlewares.incoming) {
            // allowing middlewares to return things,
            // example: a favicon handler or an auth check middleware.
            await middleware(
                this.#request,
                this.#response,
                this.#context.log,
                this.#context.error,
            );

            // a middleware returned something.
            if (this.#contextHasReturn()) break;
        }

        if (this.#contextHasReturn()) {
            // a middleware indeed returned something.
            return await this.#processHandlerResult();
        }

        if (routeHandler) {
            // execute the route handler.
            await routeHandler(
                this.#request,
                this.#response,
                this.#context.log,
                this.#context.error,
            );

            return await this.#processHandlerResult();
        } else {
            // mimic express.js and return a similar error.
            return this.#sendErrorResult(
                `Cannot ${this.#request.method.toUpperCase()} '${this.#request.path}'.`,
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
        this.#context.req.params = {};

        for (let index = 0; index < patternParts.length; index++) {
            if (patternParts[index].startsWith(':')) {
                const paramName = patternParts[index].substring(1);
                this.#context.req.params[paramName] = pathParts[index];
            }
        }
    }

    /**
     * Clears the dependency if any was injected.
     */
    #clearDependencies() {
        this.#dependencies.length = 0;
        this.#context.req._dependencies.length = 0;
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
        return (
            this.#context.res.dynamic !== null &&
            this.#context.res.dynamic !== undefined
        );
    }

    /**
     * Handles the result from either the middleware or the router handler.
     *
     * @returns {*} The result from the `routeHandlerResult`.
     */
    async #processHandlerResult() {
        // clear dependencies.
        this.#clearDependencies();

        if (this.#contextHasReturn()) {
            const dynamic = this.#context.res.dynamic;

            try {
                /**
                 * `await` the body because it `could` be a promise that
                 * resolves to a html string for rendering content or a buffer.
                 */
                dynamic.body = await dynamic.body;

                for (const interceptor of this.#middlewares.outgoing) {
                    await interceptor(
                        this.#request,
                        dynamic,
                        this.#context.log,
                        this.#context.error,
                    );
                }

                // compress at the very end!
                await this.#compress(dynamic);

                return dynamic;
            } catch (error) {
                return this.#sendErrorResult(`${error}`);
            }
        } else {
            return this.#sendErrorResult(
                `Invalid return from route ${this.#request.path}. Use 'response.empty()' if no response is expected.`,
            );
        }
    }

    /**
     * Adds the "X-Powered-By" header.
     */
    #addPoweredByHeader(dynamic) {
        if (!dynamic.headers) return;

        const headerKey = 'X-Powered-By';
        if (this.#showPoweredBy && !dynamic.headers[headerKey]) {
            dynamic.headers[headerKey] = 'AppExpress';
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
        this.#context.error(error);

        // return as per original implementation,
        // open-runtimes > node* > src > server.js
        return this.#context.res.send(error, 500, {
            'content-type': 'text/plain',
        });
    }

    /**
     * Apply appropriate compression based on the accepted encoding.
     *
     * @param {Object} dynamic - The dynamic object containing body, statusCode and headers.
     */
    async #compress(dynamic) {
        if (!this.#compression) return;

        const { headers, body } = dynamic;
        const reqHeaders = this.#context.req.headers;
        const acceptEncoding = reqHeaders['accept-encoding'];
        if (!acceptEncoding) return;

        let buffer;
        const encodings = acceptEncoding.split(',').map((enc) => enc.trim());

        if (Buffer.isBuffer(body)) buffer = body;
        else if (typeof body === 'string') buffer = Buffer.from(body);
        else return;

        if (
            // apply user side compression if available.
            !(await this.#userCompression(encodings, headers, buffer, dynamic))
        ) {
            // just apply the default compression
            this.#defaultCompression(encodings, headers, buffer, dynamic);
        }
    }

    /**
     * Use a compression provided by the user.
     */
    async #userCompression(encodings, headers, buffer, dynamic) {
        if (typeof this.#compression !== 'boolean') {
            /** @type CompressionHandler */
            const compressor = this.#compression;

            const contentType = headers['content-type'];
            const compressorEncodings = compressor.encodings;
            const supportedEncoding = encodings.find((encoding) =>
                compressorEncodings.has(encoding),
            );

            if (!supportedEncoding || !isCompressible(contentType)) {
                return false;
            }

            const compressedContent = await compressor.compress(
                buffer,
                this.#context.log,
                this.#context.error,
            );

            headers['content-encoding'] =
                Array.from(compressorEncodings).join(', ');

            this.#updateDynamic(dynamic, headers, compressedContent);
            return true;
        } else return false;
    }

    /**
     * Use the default standard compressions.
     */
    #defaultCompression(encodings, headers, buffer, dynamic) {
        const contentType = headers['content-type'];

        if (!isCompressible(contentType)) return;

        let compressedContent;

        // perf. wise : br > gzip > deflate.
        if (encodings.includes('br')) {
            headers['content-encoding'] = 'br';
            compressedContent = zlib.brotliCompressSync(buffer, {
                params: {
                    [zlib.constants.BROTLI_PARAM_QUALITY]:
                        this.#compressionLevel.br,
                },
            });
        } else if (encodings.includes('gzip')) {
            headers['content-encoding'] = 'gzip';
            compressedContent = zlib.gzipSync(buffer, {
                level: this.#compressionLevel.gzip,
            });
        } else if (encodings.includes('deflate')) {
            headers['content-encoding'] = 'deflate';
            compressedContent = zlib.deflateSync(buffer, {
                level: this.#compressionLevel.deflate,
            });
        } else return;

        this.#updateDynamic(dynamic, headers, compressedContent);
    }

    /**
     * Update the dynamic object with provided data.
     */
    #updateDynamic(dynamic, headers, body) {
        dynamic.body = body;
        dynamic.headers = headers;
        dynamic.headers['content-length'] = body.length;
    }

    /**
     * Attach the AppExpress instance.
     *
     * @param {AppwriteFunctionContext} context - The context provided by the executed `Appwrite Function`.
     */
    async attach(context) {
        // appwrite context.
        this.#context = context;

        // attach AppExpress to Function.
        return await this.#handleRequest();
    }
}

export default AppExpress;
