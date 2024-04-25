import appexpress from '@itznotabug/appexpress';

const router = new appexpress.Router();
router.all('/', (_, response) => {
    response.send(
        "You'll see me, for every type of request method on this path!",
    );
});

export default router;
