// custom logger middleware that only logs debug messages.
export const debugLoggingMiddleware = (_, __, log) => {
    log(`an example of log.`);
};

// custom logger middleware that only logs error messages.
export const errorLoggingMiddleware = (_, __, ___, error) => {
    error(`an example of error log.`);
};
