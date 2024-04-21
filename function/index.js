import AppExpress from '@itznotabug/appexpress/appexpress.js';

import {
    allPagesRouteHandler,
    dumpRouteHandler,
    emptyRouteHandler,
    indexPageRouteHandler,
    paramsRouteHandler,
    postPageRouteHandler,
    redirectRouteHandler,
} from './routes/handler.js';

import {
    debugLoggingMiddleware,
    errorLoggingMiddleware,
} from './middlewares/logging.js';

const appExpress = new AppExpress();

// set view directory
appExpress.views('static/');

// custom middlewares
appExpress.use(errorLoggingMiddleware);
appExpress.use(debugLoggingMiddleware);

appExpress.get('/', indexPageRouteHandler);
appExpress.get('/empty', emptyRouteHandler);
appExpress.post('/post', postPageRouteHandler);
appExpress.get('/redirect', redirectRouteHandler);
appExpress.get('/users/:id/:transaction', paramsRouteHandler);

appExpress.get('/dump', dumpRouteHandler);
appExpress.all('/all', allPagesRouteHandler);

// Appwrite Function Entrypoint!
export default async (context) => await appExpress.attach(context);
