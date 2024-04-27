import fs from 'fs';
import ejs from 'ejs';
import hbs from 'hbs';
import pug from 'pug';
import crypto from 'crypto';
import showdown from 'showdown';
import AppExpress from '../../../appexpress.js';

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

express.engine('ejs', ejs);
express.engine('hbs', hbs);
express.engine('pug', pug);

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

// we used a % placeholder in our sample markdown.
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

express.views('views');

// inject for later usage
express.inject(repositoryOne, 'one');
// random identifier so we cannot take a guess
express.inject(repositoryTwo, crypto.randomUUID().replace(/-/g, ''));

// middleware for auth
express.middleware((request) => {
    const { userJwtToken } = request.body;
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
        response.send(
            `we don't really have a ${mode ? 'dark ' : ''}favicon yet, sorry`,
            404,
        );
    }
});

// directs
express.get('/', (request, response) => response.send(request.method));
express.post('/', (request, response) => response.send(request.method));
express.put('/', (request, response) => response.send(request.method));
express.patch('/', (request, response) => response.send(request.method));
express.delete('/', (request, response) => response.send(request.method));
express.options('/', (request, response) => response.send(request.method));

// with router
router.get('/empty', (request, response) => response.empty());
router.get('/', (request, response) => response.json(request.body));
router.post('/:user', (request, response) =>
    response.send(request.params.user),
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
express.all('/all', (_, response) => response.send('same on all'));

// auth with a hooked middleware
express.get('/console', (_, response) => response.send('console'));

// use injected repo for test
const injectionRouter = new AppExpress.Router();
injectionRouter.get('/', (request, response) => {
    const repository = request.retrieve(LoremIpsumRepository, 'one');
    response.send(repository.get());
});

injectionRouter.get('/error', (request, response) => {
    const repository = request.retrieve(LoremIpsumRepository);
    response.send(repository.get());
});

express.use('/lorem_ipsum', injectionRouter);

// return custom headers
const headersRouter = new AppExpress.Router();
headersRouter.get('/:uuid', (request, response) => {
    const { uuid } = request.params;
    response.setHeaders({ 'custom-header': uuid });
    response.send(uuid);
});

headersRouter.get('/clear', (_, response) => response.send('cleared'));
express.use('/headers', headersRouter);

express.get('/engines/:extension', async (request, response) => {
    await response.render(`sample.${request.params.extension}`, {
        title: 'AppExpress',
    });
});

// Appwrite Function Entrypoint!
export default async (context) => await express.attach(context);
