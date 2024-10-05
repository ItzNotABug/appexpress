import cors from '@itznotabug/appexpress-cors';
import favIcon from '@itznotabug/appexpress-favicon';
import minifier from '@itznotabug/appexpress-minifier';
import * as cache from '@itznotabug/appexpress-apicache';
import noCookies from '@itznotabug/appexpress-nocookies';
import { authUserForConsoleMiddleware } from '../middlewares/auth.js';

export default (express) => {
    logEverything(express);
    minifierMiddleware(express);
    express.middleware(cors());
    express.middleware(noCookies());
    express.middleware(authUserForConsoleMiddleware);
    express.middleware(cache.createApiCache({ timeout: 0 }));
    express.middleware(favIcon({ iconPath: 'icons/favicon.ico' }));
};

const logEverything = (express) => {
    express.middleware((request) => {
        const url = request.url;

        // these won't be marked unsupported!
        console.log(`Requested Path: ${url}`);
        if (cache.hasCache(url)) {
            console.log(`This url (${url}) is cached!`);
        }
    });
};

const minifierMiddleware = (express) => {
    express.middleware(
        minifier({
            excludes: ['/robots.txt'],
            htmlOptions: {
                minifyJS: true,
                minifyCSS: true,
                removeComments: true,
                collapseWhitespace: true,
                preserveLineBreaks: false,
            },
        }),
    );
};
