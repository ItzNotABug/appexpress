// noinspection JSUnusedGlobalSymbols

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import mime from 'mime-types';
import AppExpressRequest from './request.js';
import AppExpressResponse from './response.js';
import { isCompressible, requestMethods } from './utils/index.js';
import type {
    AppExpressRequestHandler,
    AppExpressRequestMethods,
    AppExpressResponseHandler,
    AppExpressViewEngineHandler,
    AppwriteContext,
    CompressionHandler,
    InjectionRegistry,
} from './types';

/**
 * An `express.js` like framework for Appwrite Functions, enabling super-easy navigation!
 */
export default class AppExpress {
    /**
     * Represents a Router for handling HTTP requests.
     */
    static Router = class Router {
        #empty: boolean = true;
        #internalRoutes: AppExpressRequestMethods = requestMethods();

        /**
         * Registers a `GET` route.
         *
         * @param path - The URL path.
         * @param handler - The handler to execute for the path.
         */
        get(path: string, handler: AppExpressRequestHandler): void {
            this.#internalRoutes.get.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `POST` route.
         *
         * @param path - The URL path.
         * @param handler - The handler to execute for the path.
         */
        post(path: string, handler: AppExpressRequestHandler): void {
            this.#internalRoutes.post.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `PUT` route.
         *
         * @param path - The URL path.
         * @param handler - The handler to execute for the path.
         */
        put(path: string, handler: AppExpressRequestHandler): void {
            this.#internalRoutes.put.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `PATCH` route.
         *
         * @param path - The URL path.
         * @param handler - The handler to execute for the path.
         */
        patch(path: string, handler: AppExpressRequestHandler): void {
            this.#internalRoutes.patch.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a `DELETE` route.
         *
         * @param path - The URL path.
         * @param handler - The handler to execute for the path.
         */
        delete(path: string, handler: AppExpressRequestHandler): void {
            this.#internalRoutes.delete.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers an `OPTIONS` route.
         *
         * @param path - The URL path.
         * @param handler - The handler to execute for the path.
         */
        options(path: string, handler: AppExpressRequestHandler): void {
            this.#internalRoutes.options.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * Registers a route for `ALL` methods.
         *
         * @param path - The URL path.
         * @param handler - The handler to execute for the path.
         */
        all(path: string, handler: AppExpressRequestHandler): void {
            this.#internalRoutes.all.set(path, handler);
            this.#toggleEmpty();
        }

        /**
         * This method is for accessing the built routes.\
         * **Note**: This API is not for public consumption.
         *
         * @returns The routes and their respective handlers.
         */
        read(
            accessor: object,
        ):
            | { empty: boolean; internalRoutes: AppExpressRequestMethods }
            | undefined {
            if (accessor instanceof AppExpress) {
                return {
                    empty: this.#empty,
                    internalRoutes: this.#internalRoutes,
                };
            }
            return undefined;
        }

        /**
         * Toggle the empty state of the router.
         */
        #toggleEmpty(): void {
            this.#empty = false;
        }
    };

    #context?: AppwriteContext;
    #request?: AppExpressRequest;
    #response?: AppExpressResponse;
    #middlewares: {
        incoming: AppExpressRequestHandler[];
        outgoing: AppExpressResponseHandler[];
    } = {
        incoming: [],
        outgoing: [],
    };
    #dependencies: InjectionRegistry = new Map();
    #views: string = '';
    #routes: AppExpressRequestMethods = requestMethods();
    #engine: AppExpressViewEngineHandler = new Map();
    #showPoweredBy: boolean = true;
    #compression: boolean | CompressionHandler = true;
    #compressionLevel: { br: number; deflate: number; gzip: number } = {
        br: 11,
        gzip: 6,
        deflate: 6,
    };
    #cleanUrlExtensions: string[] = [];
    #indexAsDefault: boolean = false;

    /**
     * The base directory inside the docker container where the function is run.\
     * See [here](https://github.com/open-runtimes/open-runtimes/blob/main/runtimes/node/versions/latest/src/server.js#L5) how the exact path is derived.
     */
    static get baseDirectory(): string {
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
     * ```typescript
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
     *
     *     return callback(null, rendered)
     *   })
     * })
     * ```
     *
     * @param ext - The file extension[s] for the engine.
     * @param engine - The view engine that will be used for rendering content.
     */
    engine(ext: string | string[], engine: any): AppExpress {
        // construct an array for looping around...
        const extensions = Array.isArray(ext) ? ext : [ext];

        if (!extensions.every((e) => e.trim().length > 0)) {
            throw new Error('The extension(s) must be non-empty string(s).');
        }

        extensions.forEach((extension) => {
            // `ejs` & `pug` have this variable,
            // that is handled by express internally.
            if (engine.hasOwnProperty('__express')) {
                this.#engine.set(extension, engine.__express);
            } else if (typeof engine === 'function') {
                this.#engine.set(extension, engine);
            } else {
                throw new Error(
                    `Invalid engine: It must either have a '__express' property or be a function.`,
                );
            }
        });

        return this;
    }

    /**
     * Register a custom middleware.
     *
     * **Note**: `request.params` are not available to middlewares due to no `pattern` awareness.
     *
     * @param middleware - The middleware/request handler to add to the chain.
     */
    middleware(
        middleware:
            | AppExpressRequestHandler
            | {
                  incoming?: AppExpressRequestHandler;
                  outgoing?: AppExpressResponseHandler;
              },
    ): AppExpress {
        // preserve the previous behaviour.
        if (typeof middleware === 'function') {
            this.#middlewares.incoming.push(middleware);
        } else if (typeof middleware === 'object') {
            const { incoming, outgoing } = middleware;
            if (incoming) this.#middlewares.incoming.push(incoming);
            if (outgoing) this.#middlewares.outgoing.push(outgoing);
        }

        return this;
    }

    /**
     * Registers a `Router` for a given path.
     *
     * @param path - The base URL path.
     * @param router - The router that handles the extending paths.
     * @throws If the router does not have any handlers.
     */
    use(
        path: string,
        router: InstanceType<typeof AppExpress.Router>,
    ): AppExpress {
        const config = router.read(this);

        if (!config || config.empty) {
            throw new Error(`No routes defined for path '${path}'.`);
        }

        for (const method in config.internalRoutes) {
            const methodRoutes = config.internalRoutes[
                method as keyof AppExpressRequestMethods
            ] as Map<string, AppExpressRequestHandler>;
            methodRoutes.forEach((handler, route) => {
                const fullPath = this.#normalizePath(path, route);
                (
                    this.#routes[
                        method as keyof AppExpressRequestMethods
                    ] as Map<string, AppExpressRequestHandler>
                ).set(fullPath, handler);
            });
        }

        return this;
    }

    /**
     * Registers a `GET` route.
     *
     * @param path - The URL path.
     * @param handler - The handler to execute for the path.
     */
    get(path: string, handler: AppExpressRequestHandler): AppExpress {
        this.#routes.get.set(path, handler);
        return this;
    }

    /**
     * Registers a `POST` route.
     *
     * @param path - The URL path.
     * @param handler - The handler to execute for the path.
     */
    post(path: string, handler: AppExpressRequestHandler): AppExpress {
        this.#routes.post.set(path, handler);
        return this;
    }

    /**
     * Registers a `PUT` route.
     *
     * @param path - The URL path.
     * @param handler - The handler to execute for the path.
     */
    put(path: string, handler: AppExpressRequestHandler): AppExpress {
        this.#routes.put.set(path, handler);
        return this;
    }

    /**
     * Registers a `PATCH` route.
     *
     * @param path - The URL path.
     * @param handler - The handler to execute for the path.
     */
    patch(path: string, handler: AppExpressRequestHandler): AppExpress {
        this.#routes.patch.set(path, handler);
        return this;
    }

    /**
     * Registers a `DELETE` route.
     *
     * @param path - The URL path.
     * @param handler - The handler to execute for the path.
     */
    delete(path: string, handler: AppExpressRequestHandler): AppExpress {
        this.#routes.delete.set(path, handler);
        return this;
    }

    /**
     * Registers an `OPTIONS` route.
     *
     * @param path - The URL path.
     * @param handler - The handler to execute for the path.
     */
    options(path: string, handler: AppExpressRequestHandler): AppExpress {
        this.#routes.options.set(path, handler);
        return this;
    }

    /**
     * Registers a route for `ALL` methods.
     *
     * @param path - The URL path.
     * @param handler - The handler to execute for the path.
     */
    all(path: string, handler: AppExpressRequestHandler): AppExpress {
        this.#routes.all.set(path, handler);
        return this;
    }

    /**
     * Cache an instance to access it later via `AppExpressRequest#retrieve()`.\
     * Useful when you have to pass a class instance around the application.
     *
     * @param object - The instance to inject.
     * @param identifier - An optional identifier for the instance.
     * @throws If an instance already exists.
     */
    inject<T extends object>(object: T, identifier: string = ''): this {
        const objectType = object.constructor as Function;
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

        return this;
    }

    /**
     * Specify a path where your views are stored for rendering.
     *
     * @param directory - The directory path containing the views.
     */
    views(directory: string = ''): AppExpress {
        this.#views = directory;
        return this;
    }

    /**
     * Specify a path where your static files are located for public access.\
     * Requests made to these files are handled via a `middleware` and are directly served.
     *
     * @param directory - The directory path containing the public files.
     * @param exclude - Name or regex pattern to exclude files.
     */
    static(
        directory: string = '',
        exclude: (string | RegExp)[] = [],
    ): AppExpress {
        if (directory) {
            const defType = 'text/plain';
            const filesMapping = this.#processDirectory(directory, exclude);

            this.middleware((request, response) => {
                // anything other than `GET` req. method
                // doesn't make sense on static resources.
                if (request.method !== 'get') return;

                let requestedFile = filesMapping[request.path];

                // If `clean URLs` and no match found, check with `ext`.
                if (!requestedFile && this.#cleanUrlExtensions.length) {
                    const foundFile = this.#cleanUrlExtensions
                        .map((ext) => `${request.path}.${ext}`)
                        .reduce(
                            (acc: string | null, path: string) =>
                                acc || filesMapping[path] || null,
                            null,
                        );
                    if (foundFile) requestedFile = foundFile;
                }

                // If index fallback is enabled & no file found,
                // look for an `index.html` in the requested directory.
                if (!requestedFile && this.#indexAsDefault) {
                    const indexPath = path.join(request.path, 'index.html');
                    requestedFile = filesMapping[indexPath];
                }

                if (requestedFile) {
                    const options: { encoding?: BufferEncoding } = {};
                    const contentType = mime.lookup(requestedFile) || defType;

                    if (
                        contentType.startsWith('text/') ||
                        contentType === 'application/json'
                    ) {
                        options.encoding = 'utf8';
                    }

                    const fileContent = fs.readFileSync(requestedFile, options);

                    if (options.encoding === 'utf8') {
                        response.text(fileContent as string, 200, contentType);
                    } else {
                        response.binary(
                            fileContent as Buffer,
                            200,
                            contentType,
                        );
                    }
                }
            });
        }

        return this;
    }

    /**
     * Configure clean URLs for specific file extensions.\
     * This feature is **disabled** by default.
     *
     * @param extensions - List of file extensions (e.g., ['html']) for clean URLs.
     */
    cleanUrls(extensions: string[] = []): AppExpress {
        this.#cleanUrlExtensions = extensions;
        return this;
    }

    /**
     * Enable `index.html` as the default file in directories.\
     * This feature is **disabled** by default.
     *
     * @param value - Pass a boolean to enable/disable default indexing.
     */
    serveIndex(value: boolean): AppExpress {
        this.#indexAsDefault = value;
        return this;
    }

    /**
     * Whether to add response header - `X-Powered-By: AppExpress`.\
     * If a custom value for the header is provided, it will be preserved.
     *
     * Enabled by default.
     *
     * @param value - No header is added if you pass `false` or set your own header value.
     */
    poweredByHeader(value: boolean): AppExpress {
        this.#showPoweredBy = value;
        return this;
    }

    /**
     * Compress body content when sending responses back to the client.
     *
     * **Note**: Supported encodings are `br`, `gzip`, and `deflate`.
     * If the client supports multiple encodings, `br` is prioritized.
     *
     * @param value - Determines whether to enable compression, which is enabled by default, or to provide a custom compression handler.
     * @param options - Specifies the compression levels for the supported encodings.
     */
    compression(
        value: boolean | CompressionHandler = true,
        options: { br: number; deflate: number; gzip: number } = {
            br: 11,
            gzip: 6,
            deflate: 6,
        },
    ): AppExpress {
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

        return this;
    }

    /**
     * Validate min and max compression levels for an encoding.
     */
    #validateCompression(encoding: number, min: number, max: number): void {
        if (encoding < min || encoding > max) {
            throw new Error('Invalid compression level provided.');
        }
    }

    /**
     * Reads a given directory and builds file mappings.
     *
     * @param directory - The directory to read.
     * @param exclude - Name or regex pattern to exclude files.
     * @returns An object containing file names as keys and their relative path as values for reads.
     */
    #processDirectory(
        directory: string,
        exclude: (string | RegExp)[],
    ): Record<string, string> {
        let filesMapping: Record<string, string> = {};
        let directoryStack = [path.join(AppExpress.baseDirectory, directory)];

        while (directoryStack.length) {
            const currentPath = directoryStack.pop()!;
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
     * Override console logging to avoid seeing below message in executions logs on console -
     *
     * ```text
     * ----------------------------------------------------------------------------
     * Unsupported logs detected.
     * Use context.log() or context.error() for logging.
     * ----------------------------------------------------------------------------
     * ```
     */
    #overrideConsoleLogging(): void {
        if (!this.#context) return;

        // Override console methods
        console.log = this.#context.log;
        console.info = this.#context.log;
        console.warn = this.#context.log;
        console.debug = this.#context.log;
        console.error = this.#context.error;
    }

    /**
     * Handle incoming requests.
     */
    async #handleRequest(): Promise<any> {
        // build the request and response.
        this.#request = new AppExpressRequest(this.#context!);
        this.#response = new AppExpressResponse(this.#context!);

        // setup response handler.
        this.#context!.req._dependencies = this.#dependencies;
        this.#context!.res._baseDirectory = AppExpress.baseDirectory;

        if (this.#views) this.#context!.res._views = this.#views;
        if (this.#engine.size) this.#context!.res._engine = this.#engine;

        // find the route...
        const method = this.#request.method;
        let routeHandler: AppExpressRequestHandler | undefined = (
            this.#routes[method as keyof AppExpressRequestMethods] as Map<
                string,
                AppExpressRequestHandler
            >
        ).get(this.#request.path);

        if (!routeHandler) {
            for (const [path, handler] of this.#routes[
                method as keyof AppExpressRequestMethods
            ] as Map<string, AppExpressRequestHandler>) {
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
            routeHandler = (
                this.#routes[method as keyof AppExpressRequestMethods] as Map<
                    string,
                    AppExpressRequestHandler
                >
            ).get('*');
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
                this.#context!.log,
                this.#context!.error,
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
                this.#context!.log,
                this.#context!.error,
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
     * @param requestPath - The request path. Example : `/users/a4d3b4a80`
     * @param routePathPattern - The pattern of the path intended for extraction. Example : `/users/:id`
     */
    #extractParamsFromRoute(
        requestPath: string,
        routePathPattern: string,
    ): void {
        const pathParts = requestPath.split('/').filter((part) => part.length);
        const patternParts = routePathPattern
            .split('/')
            .filter((part) => part.length);

        if (patternParts.length !== pathParts.length) return;

        // default empty list.
        this.#context!.req.params = {};

        for (let index = 0; index < patternParts.length; index++) {
            if (patternParts[index]?.startsWith(':')) {
                const paramName = patternParts[index]!.substring(1);
                this.#context!.req.params![paramName] = pathParts[index]!;
            }
        }
    }

    /**
     * Combines and normalizes the basePath and route into a clean URL path.
     *
     * @param basePath - The base part of the URL path.
     * @param route - The route segment to be appended to the base path.
     * @returns The normalized URL path.
     */
    #normalizePath(basePath: string, route: string): string {
        let fullPath = `${basePath}/${route}`.replace(/\/+/g, '/');

        if (fullPath.endsWith('/') && fullPath.length > 1) {
            fullPath = fullPath.slice(0, -1);
        }
        return fullPath;
    }

    /**
     * Check if the appwrite context has the dynamic return.
     *
     * @returns true if context has return value
     */
    #contextHasReturn(): boolean {
        return (
            this.#context!.res.dynamic !== null &&
            this.#context!.res.dynamic !== undefined
        );
    }

    /**
     * Handles the result from either the middleware or the router handler.
     *
     * @returns The result from the `routeHandlerResult`.
     */
    async #processHandlerResult(): Promise<any> {
        if (this.#contextHasReturn()) {
            const dynamic = this.#context!.res.dynamic!;

            try {
                /**
                 * `await` the body because it `could` be a promise that
                 * resolves to a html string for rendering content or a buffer.
                 */
                dynamic.body = await dynamic.body;

                for (const interceptor of this.#middlewares.outgoing) {
                    await interceptor(
                        this.#request!,
                        dynamic,
                        this.#context!.log,
                        this.#context!.error,
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
                `Invalid return from route ${this.#request!.path}. Use 'response.empty()' if no response is expected.`,
            );
        }
    }

    /**
     * Adds the "X-Powered-By" header.
     */
    #addPoweredByHeader(dynamic: {
        headers?: Record<string, string | number | boolean>;
    }): void {
        if (!dynamic.headers) return;

        const headerKey = 'X-Powered-By';
        if (this.#showPoweredBy && !dynamic.headers[headerKey]) {
            dynamic.headers[headerKey] = 'AppExpress';
        }
    }

    /**
     * Return an error result to source.
     *
     * @param error - The error message.
     * @returns The result to be sent back to source.
     */
    #sendErrorResult(error: string): any {
        // for console executions.
        this.#context!.error(error);

        // return as per original implementation,
        // open-runtimes > node* > src > server.js
        return this.#context!.res.send(error, 500, {
            'content-type': 'text/plain',
        });
    }

    /**
     * Apply appropriate compression based on the accepted encoding.
     *
     * @param dynamic - The dynamic object containing body, statusCode and headers.
     */
    async #compress(dynamic: {
        body: unknown;
        headers: Record<string, string | number | boolean>;
    }): Promise<void> {
        if (!this.#compression) return;

        const { headers, body } = dynamic;
        const reqHeaders = this.#context!.req.headers;
        const acceptEncoding = reqHeaders['accept-encoding'];
        if (!acceptEncoding) return;

        let buffer: Buffer;
        const encodings = acceptEncoding
            .split(',')
            .map((enc: string) => enc.trim());

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
    async #userCompression(
        encodings: string[],
        headers: Record<string, string | number | boolean>,
        buffer: Buffer,
        dynamic: {
            body: unknown;
            headers: Record<string, string | number | boolean>;
        },
    ): Promise<boolean> {
        if (typeof this.#compression !== 'boolean') {
            const compressor = this.#compression as CompressionHandler;

            const contentType = headers['content-type'] as string;
            const compressorEncodings = compressor.encodings;
            const supportedEncoding = encodings.find((encoding) =>
                compressorEncodings.has(encoding),
            );

            if (!supportedEncoding || !isCompressible(contentType)) {
                return false;
            }

            const compressedContent = await compressor.compress(
                buffer,
                this.#context!.log,
                this.#context!.error,
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
    #defaultCompression(
        encodings: string[],
        headers: Record<string, string | number | boolean>,
        buffer: Buffer,
        dynamic: {
            body: unknown;
            headers: Record<string, string | number | boolean>;
        },
    ): void {
        const contentType = headers['content-type'];

        if (!isCompressible(contentType as string)) return;

        let compressedContent: Buffer;

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
    #updateDynamic(
        dynamic: {
            body: unknown;
            headers: Record<string, string | number | boolean>;
        },
        headers: Record<string, string | number | boolean>,
        body: Buffer,
    ): void {
        dynamic.body = body;
        dynamic.headers = headers;
        dynamic.headers['content-length'] = body.length;
    }

    /**
     * Attach the AppExpress instance.
     *
     * @param context - The context provided by the executed `Appwrite Function`.
     */
    async attach(context: AppwriteContext): Promise<any> {
        // appwrite context.
        this.#context = context;

        // override console logging.
        this.#overrideConsoleLogging();

        // attach AppExpress to Function.
        return await this.#handleRequest();
    }
}
