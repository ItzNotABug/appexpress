import appexpress from '@itznotabug/appexpress';

const router = new appexpress.Router();
router.get('/', (request, response) => {
    const { id, transaction } = request.params;
    response.send(`User Id: ${id}, Transaction ID: ${transaction}`);
});

export default router;
