import appexpress from '@itznotabug/appexpress';

const router = new appexpress.Router();

router.get('/', (request, response) => {
    const start = process.hrtime();
    const healthcheck = health(start);
    response.send(healthcheck);
});

export default router;

const health = (start) => {
    return {
        status: 'ok',
        uptime: uptime(),
        response: response(start),
        timestamp: new Date(Date.now()).toLocaleString(),
    };
};

const uptime = () => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
};

const response = (start) => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const milliseconds = nanoseconds / 1e6;
    return `${seconds}s ${milliseconds.toFixed(2)}ms`;
};
