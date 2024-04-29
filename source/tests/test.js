import crypto from 'node:crypto';
import assert from 'node:assert';
import { describe, it } from 'node:test';

import index from './src/function/index.js';
import { createContext } from './utils/context.js';

describe('Direct requests to all supported methods', () => {
    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        it(`should return the ${method} method in response body`, async () => {
            const context = createContext({ method: method });
            const { body } = await index(context);
            assert.strictEqual(body, method);
        });
    });
});

describe('Uniform response on `all` endpoint across methods', () => {
    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        it(`should receive 'same on all' response using ${method} method`, async () => {
            const context = createContext({ path: '/all', method: method });
            const { body } = await index(context);
            assert.strictEqual(body, 'same on all');
        });
    });
});

describe('Responses from router-handled endpoints', () => {
    it('should match the body with a get request to /router', async () => {
        const body = { key: 'value' };
        const context = createContext({ path: '/router', body });
        const response = await index(context);
        assert.deepStrictEqual(response, body);
    });

    it('should return an empty response for POST /router/empty', async () => {
        const context = createContext({ path: `/router/empty` });
        const response = await index(context);
        assert.strictEqual(response, '');
    });

    it('should return the user ID for POST /router/:user', async () => {
        const user = 'cad7eee9bb524d6dac9b73b6e9f2c8c6';
        const context = createContext({
            method: 'post',
            path: `/router/${user}`,
        });
        const { body } = await index(context);
        assert.strictEqual(body, user);
    });

    it('should return a structured response for POST /router/:user/:transaction', async () => {
        const user = 'cad7eee9bb524d6dac9b73b6e9f2c8c6';
        const transaction = '0835fbe57f3540b3badd10fc31466fd9';
        const context = createContext({
            method: 'post',
            path: `/router/${user}/${transaction}`,
        });
        const response = await index(context);
        assert.deepStrictEqual(response, { user, transaction });
    });
});

describe('Handling invalid method requests to specific endpoints', () => {
    ['post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        it(`should return an error when using ${method.toUpperCase()} on '/get' endpoint`, async () => {
            const context = createContext({ path: '/get', method: method });
            const { body } = await index(context);
            assert.strictEqual(body, `Cannot ${method.toUpperCase()} '/get'.`);
        });
    });
});

describe('Response for non-existing endpoints', () => {
    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        it(`should return an error for ${method.toUpperCase()} request to '/void'`, async () => {
            const context = createContext({ path: '/void', method: method });
            const { body } = await index(context);
            assert.strictEqual(body, `Cannot ${method.toUpperCase()} '/void'.`);
        });
    });
});

describe('Internal server error handling', () => {
    it('should return a 500 status code for invalid returns', async () => {
        const context = createContext({ path: '/get' });
        const { statusCode } = await index(context);
        assert.strictEqual(statusCode, 500);
    });
});

describe('Middleware handling', () => {
    it('should throw an error when no JWT Token is found', async () => {
        const context = createContext({ path: '/console', method: 'get' });
        try {
            await index(context);
        } catch (error) {
            assert.strictEqual(
                error.message,
                'No JWT Token found, aborting the requests.',
            );
        }
    });

    it("should return 'console' in the response body when a JWT Token is provided", async () => {
        const context = createContext({
            path: '/console',
            method: 'get',
            body: {
                userJwtToken:
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            },
        });
        const { body } = await index(context);
        assert.strictEqual(body, 'console');
    });

    it('should return a message from the middleware', async () => {
        const context = createContext({
            path: '/assets/favicon',
        });

        const { body, statusCode } = await index(context);
        assert.deepStrictEqual(
            { body, statusCode },
            {
                body: `we don't really have a favicon yet, sorry`,
                statusCode: 404,
            },
        );
    });

    it('should return a message from the middleware', async () => {
        const context = createContext({
            path: '/assets/favicon',
            query: {
                mode: 'dark',
            },
        });

        const { body, statusCode } = await index(context);
        assert.deepStrictEqual(
            { body, statusCode },
            {
                body: `we don't really have a dark favicon yet, sorry`,
                statusCode: 404,
            },
        );
    });
});

describe('Custom headers validation', () => {
    it('should return a custom header', async () => {
        const randomHeaderValue = crypto.randomUUID().replace(/-/g, '');
        const context = createContext({
            path: `/headers/${randomHeaderValue}`,
            method: 'get',
        });
        const { headers } = await index(context);
        assert.strictEqual(headers['custom-header'], randomHeaderValue);
    });

    it('should only return the default header', async () => {
        const context = createContext({
            path: `/headers/clear`,
            method: 'get',
        });

        const { headers } = await index(context);
        // only the `content-type` should be available at this point.
        assert.strictEqual(Object.keys(headers).length, 1);

        assert.strictEqual(headers['content-type'], 'text/plain');
    });
});

describe('Injected dependency validation', () => {
    it('should return lorem ipsum text', async () => {
        const context = createContext({ path: '/lorem_ipsum', method: 'get' });
        const { body } = await index(context);
        assert.strictEqual(
            body,
            'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        );
    });

    it('should throw an error when dependencies is not found', async () => {
        const context = createContext({
            path: '/lorem_ipsum/error',
            method: 'get',
        });
        try {
            await index(context);
        } catch (error) {
            assert.strictEqual(
                error.message,
                `No instance found for 'LoremIpsumRepository'.`,
            );
        }
    });
});

describe('render template contents', () => {
    const expectedReturn = `<h1>Welcome to AppExpress</h1>`;

    it('should return rendered content from EJS template', async () => {
        const context = createContext({ path: '/engines/ejs' });
        const { body } = await index(context);
        assert.strictEqual(body, expectedReturn);
    });

    it('should return rendered content from HBS template', async () => {
        const context = createContext({ path: '/engines/hbs' });
        const { body } = await index(context);
        assert.strictEqual(body, expectedReturn);
    });

    it('should return rendered content from PUG template', async () => {
        const context = createContext({ path: '/engines/pug' });
        const { body } = await index(context);
        assert.strictEqual(body, expectedReturn);
    });

    it('should return rendered content from a custom defined (apw) template', async () => {
        const context = createContext({ path: '/engines/apw' });
        const { body } = await index(context);
        assert.strictEqual(body, expectedReturn);
    });

    it('should return rendered content from a custom defined Markdown template', async () => {
        const context = createContext({ path: '/engines/md' });
        const { body } = await index(context);
        assert.strictEqual(body, expectedReturn);
    });
});

describe('render partials contents on hbs engine', () => {
    const expected = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>AppExpress</title></head><body><h1>AppExpress</h1><article><header><h3>Routing for Appwrite Functions!</h3></header><section>An express.js like framework for Appwrite Functions, enabling super-easy navigation!</section><footer><p>Written by: @ItzNotABug</p></footer></article></body></html>`;

    it('should render an article using the HBS extension and include content from a partial', async () => {
        const context = createContext({
            path: '/engines/hbs/article',
            query: { extension: 'hbs' },
        });
        const { body } = await index(context);
        const cleanBody = body.replace(/\n/g, '').replace(/ {2,}/g, '');
        assert.strictEqual(cleanBody, expected);
    });

    it('should render an article using the HTML extension and include content from a partial', async () => {
        const context = createContext({
            path: '/engines/hbs/article',
            query: { extension: 'html' },
        });
        const { body } = await index(context);
        const cleanBody = body.replace(/\n/g, '').replace(/ {2,}/g, '');
        assert.strictEqual(cleanBody, expected);
    });
});
