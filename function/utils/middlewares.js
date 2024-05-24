import favIcon from '@itznotabug/appexpress-favicon';
import apiCache from '@itznotabug/appexpress-apicache';
import minifier from '@itznotabug/appexpress-minifier';
import noCookies from '@itznotabug/appexpress-nocookies';
import { authUserForConsoleMiddleware } from '../middlewares/auth.js';

export default (express) => {
    cacheEverything(express);
    favIconMiddleware(express);
    minifierMiddleware(express);
    express.middleware(noCookies.middleware);
    express.middleware(authUserForConsoleMiddleware);

    express.middleware((request) => {
        // this log won't be considered unsupported!
        console.log(`Requested Path: ${request.path}`);
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
