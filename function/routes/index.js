import AppExpress from '@itznotabug/appexpress';

const router = new AppExpress.Router();

// index content.
const indexContent =
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AppExpress</title><link rel="stylesheet" type="text/css" href="/styles.css"></head><body><div class="container"><div class="logo">AppExpress</div><div class="slogan">An<code style="font-size:16px">`express.js`</code>like framework for<br>Appwrite Functions, enabling super-easy navigation!</div><button class="action-button" onclick="learnMore()">Learn More</button></div><footer>Built by<a href="https://github.com/itznotabug" target="_blank">@ItzNotABug</a><p>This is rendered from a raw html string.</p></footer><script>function learnMore(){window.open("https://github.com/itznotabug/appexpress","_blank")}</script></body></html>';

router.get('/', (req, res) => {
    const { type } = req.query;
    switch (type) {
        case 'html':
            res.binary('index.html');
            break;
        case 'string':
        default:
            res.text(indexContent, 200, 'text/html');
            break;
        case 'js':
        case 'jsx':
        case 'tsx':
        case 'ejs':
        case 'hbs':
        case 'pug':
        case 'md':
            res.render(
                `index.${type}`,
                buildContent(type === 'md' ? 'markdown' : type),
            );
            break;
    }
});

router.post('/', (_, res) => {
    res.json({ message: 'great! you did a post request.' });
});

function buildContent(type) {
    return {
        title: 'AppExpress',
        slogan: `An <code style='font-size: 16px'>\`express.js\`</code> like framework for<br />Appwrite Functions, enabling super-easy navigation!`,
        developer: {
            handle: '@ItzNotABug',
            url: 'https://github.com/itznotabug',
        },
        renderType: `This is rendered from a ${type === 'string' ? `${type}` : `${type} file`}.`,
    };
}

export default router;
