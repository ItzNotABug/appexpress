import AppExpress from '@itznotabug/appexpress';

import allRouteHandler from './routes/all.js';
import indexRouteHandler from './routes/index.js';
import healthRouteHandler from './routes/health.js';
import paramsRouteHandler from './routes/params.js';
import redirectRouteHandler from './routes/redirect.js';
import { favIconMiddleware } from './middlewares/favicon.js';
import { authUserForConsoleMiddleware } from './middlewares/auth.js';
import {
    debugLoggingMiddleware,
    errorLoggingMiddleware,
} from './middlewares/logging.js';

const express = new AppExpress();

// set views directory
express.views('static/');

// custom middlewares
express.middleware(favIconMiddleware);
express.middleware(errorLoggingMiddleware);
express.middleware(debugLoggingMiddleware);
express.middleware(authUserForConsoleMiddleware);

// using router for management.
express.use('/', indexRouteHandler);
express.use('/all', allRouteHandler);
express.use('/health', healthRouteHandler);

express.use('/redirect', redirectRouteHandler);
express.use('/users/:id/:transaction', paramsRouteHandler);

// using the `RequestHandler` direct.
express.get('/dump', (request, response) => {
    response.json(JSON.parse(request.dump()));
});

express.get('/empty', (_, response) => response.empty());
express.get('/console', (_, response) => response.empty());
express.get('/ping', (_, response) => response.send('pong'));

// Appwrite Function Entrypoint!
export default async (context) => await express.attach(context);
