import AppExpress from '@itznotabug/appexpress';

const router = new AppExpress.Router();
router.get('/', (req, res) => {
    const query = res.query;
    const url = query['redirect_url'] ?? 'https://github.com/itznotabug';
    res.redirect(url);
});

export default router;
