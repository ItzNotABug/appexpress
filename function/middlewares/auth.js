export const authUserForConsoleMiddleware = (request) => {
    const { userJwtToken } = request.body;
    const isConsole = request.path.includes('/console');

    if (isConsole && !userJwtToken) {
        throw Error('No JWT Token found, aborting the requests.');
    }
};
