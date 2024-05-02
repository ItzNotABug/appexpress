export const authUserForConsoleMiddleware = (req) => {
    const { userJwtToken } = req.body;
    const isConsole = req.path.includes('/console');

    if (isConsole && !userJwtToken) {
        throw Error('No JWT Token found, aborting the requests.');
    }
};
