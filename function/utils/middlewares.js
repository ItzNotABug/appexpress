import favIcon from '@itznotabug/appexpress-favicon';
import apiCache from '@itznotabug/appexpress-apicache';
import minifier from '@itznotabug/appexpress-minifier';
import noCookies from '@itznotabug/appexpress-nocookies';
import { authUserForConsoleMiddleware } from '../middlewares/auth.js';

export default (express) => {
    logEverything(express);
    cacheEverything(express);
    favIconMiddleware(express);
    minifierMiddleware(express);
    express.middleware(noCookies.middleware);
    express.middleware(authUserForConsoleMiddleware);
};

const logEverything = (express) => {
    express.middleware((request) => {
        const url = request.url;

        // these won't be marked unsupported!
        console.log(`Requested Path: ${url}`);
        if (apiCache.hasCache(url)) {
            console.log(`This url (${url}) is cached!`);
        }
    });
};

const cacheEverything = (express) => {
    apiCache.options({ timeout: 0 });
    express.middleware(apiCache.middleware);
};

const favIconMiddleware = (express) => {
    favIcon.options({
        iconPath: 'icons/favicon.ico',
    });

    express.middleware(favIcon.middleware);
};

const minifierMiddleware = (express) => {
    minifier.options({
        excludes: ['/robots.txt'],
        htmlOptions: {
            minifyJS: true,
            minifyCSS: true,
            removeComments: true,
            collapseWhitespace: true,
            preserveLineBreaks: false,
        },
    });

    express.middleware(minifier.middleware);
};
