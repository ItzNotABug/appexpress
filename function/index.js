import AppExpress from '@itznotabug/appexpress';

// engines, middlewares, etc.
import setEngines from './utils/engines.js';
import setMiddlewares from './utils/middlewares.js';

// routes
import indexRouteHandler from './routes/index.js';
import healthRouteHandler from './routes/health.js';
import paramsRouteHandler from './routes/params.js';
import { registeredRoutes } from './utils/routes.js';
import redirectRouteHandler from './routes/redirect.js';
import versionsRouteHandler from './routes/versions.js';

const express = new AppExpress();

setEngines(express);
setMiddlewares(express);
express.views('views');
express.static('public');

// using router for management.
express.use('/', indexRouteHandler);
express.use('/health', healthRouteHandler);
express.use('/redirect', redirectRouteHandler);
express.use('/versions', versionsRouteHandler);
express.use('/users/:id/:transaction', paramsRouteHandler);

express.get('/empty', (_, res) => res.empty());
express.get('/console', (_, res) => res.empty());
express.get('/ping', (_, res) => res.send('pong'));
express.post('/pong', (_, res) => res.send('ping'));
express.all('/all', (req, res) => res.send('same for all'));
express.get('/dump', (req, res) => res.json(JSON.parse(req.dump())));
express.get('/routes', (req, res) => {
    const { excludeMinify = true } = req.query;
    res.setHeaders({ 'exclude-minify': excludeMinify });
    res.send(JSON.stringify(registeredRoutes, null, 2));
});

// Appwrite Function Entrypoint!
export default async (context) => await express.attach(context);
