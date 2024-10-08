import AppExpress from '@itznotabug/appexpress';

const router = new AppExpress.Router();
router.get('/', (req, res) => {
    const { id, transaction } = req.params;
    res.text(`User Id: ${id}, Transaction ID: ${transaction}`);
});

export default router;
