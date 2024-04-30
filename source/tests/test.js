import fs from 'fs';
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
    const expected = 'same on all';

    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        it(`should receive 'same on all' response using ${method} method`, async () => {
            const context = createContext({ path: '/all', method: method });
            const { body } = await index(context);
            assert.strictEqual(body, expected);
        });
    });
});

describe('Responses from router-handled endpoints', () => {
    it('should match the body with a get request to /router', async () => {
        const postBody = { key: 'value' };
        const context = createContext({ path: '/router', body: postBody });
        const { body } = await index(context);
        assert.deepStrictEqual(body, postBody);
    });

    it('should return an empty response for POST /router/empty', async () => {
        const context = createContext({ path: `/router/empty` });
        const { body } = await index(context);
        assert.strictEqual(body, '');
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
        const details = {
            user: 'cad7eee9bb524d6dac9b73b6e9f2c8c6',
            transaction: '0835fbe57f3540b3badd10fc31466fd9',
        };

        const context = createContext({
            method: 'post',
            path: `/router/${details.user}/${details.transaction}`,
        });

        const { body } = await index(context);
        assert.deepStrictEqual(body, details);
    });
});

describe('Handling invalid method requests to specific endpoints', () => {
    ['post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        const expected = `Cannot ${method.toUpperCase()} '/get'.`;

        it(`should return an error when using ${method.toUpperCase()} on '/get' endpoint`, async () => {
            const context = createContext({ path: '/get', method: method });
            const { body } = await index(context);
            assert.strictEqual(body, expected);
        });
    });
});

describe('Response for non-existing endpoints', () => {
    ['get', 'post', 'put', 'patch', 'delete', 'options'].forEach((method) => {
        const expected = `Cannot ${method.toUpperCase()} '/void'.`;

        it(`should return an error for ${method.toUpperCase()} request to '/void'`, async () => {
            const context = createContext({ path: '/void', method: method });
            const { body } = await index(context);
            assert.strictEqual(body, expected);
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
        let message;
        const expected = 'No JWT Token found, aborting the requests.';
        const context = createContext({ path: '/console' });

        try {
            const { body } = await index(context);
            message = body;
        } catch (error) {
            message = error.message;
        }

        assert.strictEqual(message, expected);
    });

    it("should return 'console' in the response body when a JWT Token is provided", async () => {
        const expected = 'console';
        const context = createContext({
            path: '/console',
            body: {
                userJwtToken:
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
            },
        });

        const { body } = await index(context);
        assert.strictEqual(body, expected);
    });

    it('should return a message from the middleware', async () => {
        const expected = {
            statusCode: 404,
            body: `we don't really have a favicon yet, sorry`,
        };

        const context = createContext({
            path: '/assets/favicon',
        });

        const { body, statusCode } = await index(context);
        assert.deepStrictEqual({ body, statusCode }, expected);
    });

    it('should return a message from the middleware', async () => {
        const expected = {
            statusCode: 404,
            body: `we don't really have a dark favicon yet, sorry`,
        };

        const context = createContext({
            path: '/assets/favicon',
            query: {
                mode: 'dark',
            },
        });

        const { body, statusCode } = await index(context);
        assert.deepStrictEqual({ body, statusCode }, expected);
    });
});

describe('Custom headers validation', () => {
    it('should return a custom header', async () => {
        const randomHeaderValue = crypto.randomUUID().replace(/-/g, '');
        const context = createContext({
            path: `/headers/${randomHeaderValue}`,
        });

        const { headers } = await index(context);
        assert.strictEqual(headers['custom-header'], randomHeaderValue);
    });

    it('should only return the default header', async () => {
        const expected = { length: 1, type: 'text/plain' };
        const context = createContext({
            path: `/headers/clear`,
        });

        const { headers } = await index(context);
        assert.strictEqual(headers['content-type'], expected.type);
        assert.strictEqual(Object.keys(headers).length, expected.length);
    });
});

describe('Injected dependency validation', () => {
    it('should return lorem ipsum text', async () => {
        const expected =
            'Lorem Ipsum is simply dummy text of the printing and typesetting industry.';

        const context = createContext({ path: '/lorem_ipsum' });
        const { body } = await index(context);
        assert.strictEqual(body, expected);
    });

    it('should throw an error when dependencies is not found', async () => {
        let message;
        const expected = `No instance found for 'LoremIpsumRepository'.`;
        const context = createContext({
            path: '/lorem_ipsum/error',
        });

        try {
            const { body } = await index(context);
            message = body;
        } catch (error) {
            message = error.message;
        }

        assert.strictEqual(message, expected);
    });
});

describe('Render template contents', () => {
    const expected = `<h1>Welcome to AppExpress</h1>`;

    ['ejs', 'hbs', 'pug', 'apw', 'md'].forEach((template) => {
        it(`should return rendered content from ${template.toUpperCase()} template`, async () => {
            const context = createContext({ path: `/engines/${template}` });
            const { body } = await index(context);
            assert.strictEqual(body, expected);
        });
    });
});

describe('Render partials contents supported engines', () => {
    const expected = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>AppExpress</title></head><body><h1>AppExpress</h1><article><header><h3>Routing for Appwrite Functions!</h3></header><section>An express.js like framework for Appwrite Functions, enabling super-easy navigation!</section><footer><p>Written by: @ItzNotABug</p></footer></article></body></html>`;

    [{ HBS: ['hbs', 'html'] }, { EJS: ['ejs'] }].forEach((engine) => {
        Object.entries(engine).forEach(([engineName, extensions]) => {
            extensions.forEach((extension) => {
                it(`should render an article using ${engineName.toUpperCase()} engine & ${extension.toUpperCase()} extension`, async () => {
                    const context = createContext({
                        path: '/engines/article',
                        query: { extension: extension },
                    });

                    const { body } = await index(context);
                    const cleanBody = body
                        .replace(/\n/g, '')
                        .replace(/ {2,}/g, '');
                    assert.strictEqual(cleanBody, expected);
                });
            });
        });
    });
});

describe('Public static resource handling', () => {
    const publicDir = './src/function/public';

    it('should return the contents of ads.txt', async () => {
        const adsTxt = `${publicDir}/ads.txt`;
        const adsTxtContent = fs.readFileSync(adsTxt, 'utf8');

        const context = createContext({ path: '/ads.txt' });
        const { body } = await index(context);
        assert.strictEqual(body, adsTxtContent);
    });

    it('should return the contents of robots.txt', async () => {
        const robotsTxt = `${publicDir}/robots.txt`;
        const robotsTxtContent = fs.readFileSync(robotsTxt, 'utf8');

        const context = createContext({ path: '/robots.txt' });
        const { body } = await index(context);
        assert.strictEqual(body, robotsTxtContent);
    });

    it('should return Cannot GET /.env', async () => {
        const context = createContext({ path: '/.env' });
        const { body } = await index(context);
        assert.strictEqual(body, `Cannot GET '/.env'.`);
    });

    it('should return contents from a nested directory', async () => {
        const acmeTxt = `${publicDir}/.well-known/acme-challenge/dc64a9a5f9ca432ba8c6f2fe8e5c35be`;
        const acmeTxtContent = fs.readFileSync(acmeTxt, 'utf8');

        const context = createContext({
            path: '/.well-known/acme-challenge/dc64a9a5f9ca432ba8c6f2fe8e5c35be',
        });
        const { body } = await index(context);
        assert.strictEqual(body, acmeTxtContent);
    });

    it('should return contents from a css file in a nested directory', async () => {
        const css = `${publicDir}/static/css/styles.css`;
        const cssContent = fs.readFileSync(css, 'utf8');

        const context = createContext({
            path: '/static/css/styles.css',
        });
        const { body } = await index(context);
        assert.strictEqual(body, cssContent);
    });

    it('should return contents from a js file in a nested directory', async () => {
        const js = `${publicDir}/static/js/window.js`;
        const jsContent = fs.readFileSync(js); // not served as `text/*`

        const context = createContext({
            path: '/static/js/window.js',
        });
        const { body } = await index(context);
        assert.deepStrictEqual(body, jsContent);
    });
});

describe('Multiple returns error validation', () => {
    it(`should return an error due to multiple response.* call on a route`, async () => {
        let message;
        const expected =
            'A response has already been prepared. Cannot initiate another response. Did you call response methods like `response.send` or `response.json` multiple times in the same request handler?';
        const context = createContext({ path: '/error/multi-return' });

        try {
            const { body } = await index(context);
            message = body;
        } catch (error) {
            message = error.message;
        }

        assert.strictEqual(message, expected);
    });
});
