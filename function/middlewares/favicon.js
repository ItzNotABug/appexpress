import etag from 'etag';
import fresh from 'fresh';
import fs from 'fs/promises';

let iconCache;
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export const favIconMiddleware = async (req, res, log) => {
    const isFavIconPath = req.path === '/favicon.ico';
    if (!isFavIconPath) return;

    // shamelessly copied from `express-favicon`.
    if (isRequestValid(req, res)) await sendIcon(req, res, log);
};

const isRequestValid = (request, response) => {
    if (request.method !== 'get' && request.method !== 'head') {
        response.setHeaders({
            'content-length': '0',
            allow: 'GET, HEAD, OPTIONS',
        });

        response.send('', request.method === 'options' ? 200 : 405);
        return false;
    }

    return true;
};

const sendIcon = async (request, response, log) => {
    if (iconCache) log('Serving `favicon` from memory.');

    // save some `ms` if the container is already running!
    iconCache = iconCache ? iconCache : await readFaviconFile();

    const responseHeaders = {
        etag: etag(iconCache),
        'content-length': iconCache.length,
        'cache-control': `public, max-age=${ONE_YEAR_SECONDS}`,
    };

    if (isFresh(request.headers, responseHeaders)) {
        request.send('', 302);
        return;
    }

    response.setHeaders(responseHeaders);
    response.send(iconCache, 200, 'image/x-icon');
};

const isFresh = (reqHeaders, resHeaders) => {
    return fresh(reqHeaders, { etag: resHeaders.etag });
};

const readFaviconFile = async () => {
    // we should probably use the `express.baseDirectory` variable!
    return await fs.readFile('./src/function/public/favicon.ico');
};
