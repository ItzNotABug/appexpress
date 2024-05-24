import { readFile } from 'fs/promises';
import AppExpress from '@itznotabug/appexpress';

const router = new AppExpress.Router();

const readJSON = async (path) => {
    const jsonText = await readFile(path, { encoding: 'utf8' });
    return JSON.parse(jsonText);
};

const get = async () => {
    const root = '../';
    const file = 'package.json';
    const thisPackagePath = new URL(`${root}${file}`, import.meta.url);
    const sourcePackagePath = new URL(
        `${root}node_modules/@itznotabug/appexpress/${file}`,
        import.meta.url,
    );

    const thisPackage = await readJSON(thisPackagePath);
    const sourcePackage = await readJSON(sourcePackagePath);

    return { thisPackage, sourcePackage };
};

router.get('/', async (_, response) => {
    const { thisPackage, sourcePackage } = await get();
    response.json({
        function: thisPackage.version,
        appexpress: sourcePackage.version,
    });
});

export default router;
