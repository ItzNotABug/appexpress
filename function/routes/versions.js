import appexpress from '@itznotabug/appexpress';
import thisPackage from '../package.json' assert { type: 'json' };
import sourcePackage from '@itznotabug/appexpress/package.json' assert { type: 'json' };

const router = new appexpress.Router();
router.get('/', (_, response) => {
    response.json({
        function: thisPackage.version,
        appexpress: sourcePackage.version,
    });
});

export default router;
