import ejs from 'ejs';
import pug from 'pug';
import showdown from 'showdown';
import hbs from 'express-handlebars';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import AppExpress from '../../../appexpress.js';
import noCookies from '@itznotabug/appexpress-nocookies';

/**
 * Sample repository for `DI`.
 */
class LoremIpsumRepository {
    constructor() {
        this._loremIpsum =
            'Lorem Ipsum is simply dummy text of the printing and typesetting industry.';
    }

    get = () => this._loremIpsum;
}

const express = new AppExpress();
const router = new AppExpress.Router();
const repositoryOne = new LoremIpsumRepository();
const repositoryTwo = new LoremIpsumRepository();

express.views('views');
express.serveIndex(true);
express.cleanUrls(['html', 'txt']);
express.static('public', [/^\..*env.*/i]);

express.engine('ejs', ejs); // ejs
express.engine('pug', pug); // pub

// hbs, html
express.engine(
    ['hbs', 'html'],
    hbs.engine({
        extname: 'hbs',
        defaultLayout: false,
        partialsDir: path.join(AppExpress.baseDirectory, 'views/partials'),
    }),
);

// apw is appwrite, hehe.
express.engine('apw', (filePath, options, callback) => {
    fs.readFile(filePath, (error, content) => {
        if (error) return callback(error);
        const rendered = content
            .toString()
            .replace(/#([^#]+)#/g, (match, key) => options[key] || match)
            .replace(/@\/?headerOne/g, (match) =>
                match === '@headerOne' ? '<h1>' : '</h1>',
            );

        return callback(null, rendered);
    });
});

// we use a `%` placeholder in our sample markdown.
express.engine('md', (filePath, options, callback) => {
    fs.readFile(filePath, (error, content) => {
        if (error) return callback(error);
        let rendered = content
            .toString()
            .replace(/%([^%]+)%/g, (match, key) => options[key] || match);

        const converter = new showdown.Converter();
        converter.setOption('noHeaderId', true);
        rendered = converter.makeHtml(rendered);

        return callback(null, rendered);
    });
});

// inject for later usage
express.inject(repositoryOne, 'one');
// random identifier so we cannot take a guess
express.inject(repositoryTwo, crypto.randomUUID().replace(/-/g, ''));

// middleware for auth
express.middleware((request) => {
    const { userJwtToken } = request.bodyJson;
    const isConsole = request.path.includes('/console');

    if (isConsole && !userJwtToken) {
        throw Error('No JWT Token found, aborting the requests.');
    }
});

// middleware for direct return
express.middleware((request, response) => {
    const isFavIconPath =
        request.method === 'get' && request.path.includes('assets');
    if (isFavIconPath) {
        const { mode } = request.query;
        response.text(
            `we don't really have a ${mode ? 'dark ' : ''}favicon yet, sorry`,
            404,
        );
    }
});

// intercepting response
express.middleware({
    outgoing: (_, interceptor) => {
        interceptor.headers['X-Server-Powered-By'] = 'Appwrite x Swoole';
    },
});

// hard cookie remover
express.middleware(noCookies());

// override body content
express.middleware({
    outgoing: (request, interceptor) => {
        if (request.path === '/body_override') interceptor.body = 'outgoing';
    },
});

// directs
express.get('/methods', (request, response) => response.text(request.method));
express.post('/methods', (request, response) => response.text(request.method));
express.put('/methods', (request, response) => response.text(request.method));
express.patch('/methods', (request, response) => response.text(request.method));
express.delete('/methods', (request, response) =>
    response.text(request.method),
);
express.options('/methods', (request, response) =>
    response.text(request.method),
);

// with router
router.get('/empty', (request, response) => response.empty());
router.get('/', (request, response) => response.json(request.bodyJson));
router.post('/:user', (request, response) =>
    response.text(request.params.user),
);
router.post('/:user/:transaction', (request, response) => {
    response.json({
        user: request.params.user,
        transaction: request.params.transaction,
    });
});

express.use('/router', router);

// get method only for testing `Cannot [method] '[path]'`
express.get('/get', (_, __) => {
    // this route isn't called while testing.
    // response.send('get');
});

// all
express.all('/all', (_, response) => response.text('same on all'));

// auth with a hooked middleware
express.get('/console', (_, response) => response.text('console'));

// use injected repo for test
const injectionRouter = new AppExpress.Router();
injectionRouter.get('/', (request, response) => {
    const repository = request.retrieve(LoremIpsumRepository, 'one');
    response.text(repository.get());
});

injectionRouter.get('/error', (request, response) => {
    const repository = request.retrieve(LoremIpsumRepository);
    response.text(repository.get());
});

express.use('/lorem_ipsum', injectionRouter);

// return custom headers
const headersRouter = new AppExpress.Router();
headersRouter.get('/:uuid', (request, response) => {
    const { uuid } = request.params;
    response.setHeaders({ 'custom-header': uuid });
    response.text(uuid);
});

headersRouter.get('/clear', (_, response) => response.text('cleared'));
express.use('/headers', headersRouter);

express.get('/engines/:extension', (request, response) => {
    const fileName = `sample.${request.params.extension}`;
    response.render(fileName, { title: 'AppExpress' });
});

express.get('/engines/article', (request, response) => {
    const { extension } = request.query;

    response.render(`article.${extension}`, {
        title: 'AppExpress',
        subtitle: 'Routing for Appwrite Functions!',
        content:
            'An express.js like framework for Appwrite Functions, enabling super-easy navigation!',
        author: '@ItzNotABug',
    });
});

// multiple returns are not allowed.
express.get('/error/multi-return', (_, response) => {
    response.text('ok');
    response.text('ok');
});

express.get('/outgoing', (_, res) => res.empty());
express.get('/body_override', (_, res) => res.empty());
express.get('/cookies', (_, res) => {
    res.setHeaders({ cookie: crypto.randomUUID() });
    res.empty();
});

express.post('/binary', (request, response) => {
    const binaryFileContents = request.bodyBinary;
    const contentTypeHeader = request.headers['content-type'];
    if (binaryFileContents) {
        return response.binary(binaryFileContents, 200, contentTypeHeader);
    } else {
        return response.text('Internal Server Error', 500);
    }
});

// Appwrite Function Entrypoint!
export default async (context) => await express.attach(context);
