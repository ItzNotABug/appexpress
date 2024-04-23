import assert from 'node:assert';
import { describe, it } from 'node:test';

import index from './entrypoint/index.js';
import { createContext } from './utils/context.js';

describe('Direct requests to all supported methods', () => {
    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        it(`should return the ${method} method in response body`, async () => {
            const context = createContext({ method: method });
            const response = await index(context);
            assert.strictEqual(response.body, method);
        });
    });
});

describe('Uniform response on `all` endpoint across methods', () => {
    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        it(`should receive 'same on all' response using ${method} method`, async () => {
            const context = createContext({ path: '/all', method: method });
            const response = await index(context);
            assert.strictEqual(response.body, 'same on all');
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
        const response = await index(context);
        assert.strictEqual(response.body, user);
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
            const response = await index(context);
            assert.strictEqual(
                response.body,
                `Cannot ${method.toUpperCase()} '/get'.`,
            );
        });
    });
});

describe('Response for non-existing endpoints', () => {
    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        it(`should return an error for ${method.toUpperCase()} request to '/void'`, async () => {
            const context = createContext({ path: '/void', method: method });
            const response = await index(context);
            assert.strictEqual(
                response.body,
                `Cannot ${method.toUpperCase()} '/void'.`,
            );
        });
    });
});

describe('Internal server error handling', () => {
    it('should return a 500 status code for invalid returns', async () => {
        const context = createContext({ path: '/get', method: 'get' });
        const response = await index(context);
        assert.strictEqual(response.statusCode, 500);
    });
});

describe('Middleware error handling', () => {
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
        const response = await index(context);
        assert.strictEqual(response.body, 'console');
    });
});

describe('Injected dependency validation', () => {
    it('should return lorem ipsum text', async () => {
        const context = createContext({ path: '/lorem_ipsum', method: 'get' });
        const response = await index(context);
        assert.strictEqual(
            response.body,
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
