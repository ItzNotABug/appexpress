export const favIconMiddleware = async (request, response) => {
    const isFavIconPath =
        (request.method === 'get' || request.method === 'head') &&
        request.path.includes('/favicon.ico');
    if (isFavIconPath) {
        const icon = await response.readFile('favicon.ico');
        response.send(icon, 200, 'image/x-icon');
    }
};
