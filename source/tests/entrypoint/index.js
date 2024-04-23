import * as crypto from 'node:crypto';
import AppExpress from '../../appexpress.js';

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

// Appwrite Function Entrypoint!
export default async (context) => await express.attach(context);
