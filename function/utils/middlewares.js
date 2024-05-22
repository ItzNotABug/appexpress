import favIcon from '@itznotabug/appexpress-favicon';
import minifier from '@itznotabug/appexpress-minifier';
import noCookies from '@itznotabug/appexpress-nocookies';
import { authUserForConsoleMiddleware } from '../middlewares/auth.js';

export default (express) => {
    favIconMiddleware(express);
    minifierMiddleware(express);
    express.middleware(noCookies.middleware);
    express.middleware(authUserForConsoleMiddleware);
};

const favIconMiddleware = (express) => {
    favIcon.options({
        iconPath: 'icons/favicon.ico',
    });

    express.middleware(favIcon.middleware);
};

const minifierMiddleware = (express) => {
    minifier.options({
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
