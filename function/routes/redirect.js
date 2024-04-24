import appexpress from '@itznotabug/appexpress';

const router = new appexpress.Router();
router.get('/', (request, response) => {
    const query = request.query;
    const url = query['redirect_url'] ?? 'https://github.com/itznotabug';
    response.redirect(url);
});

export default router;
