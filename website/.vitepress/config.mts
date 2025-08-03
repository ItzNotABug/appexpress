import { defineConfig } from 'vitepress';

export default defineConfig({
    title: 'AppExpress',
    description:
        'An express.js like framework for Appwrite Functions, enabling super-easy navigation!',
    cleanUrls: true,
    metaChunk: true,
    ignoreDeadLinks: true,
    appearance: 'force-dark',
    markdown: {
        anchor: { permalink: false },
        image: { lazyLoading: true },
    },
    srcExclude: ['scripts/'],
    themeConfig: {
        footer: {
            message:
                'Built for <img src="/svgs/appwrite.svg" height="16px" width="16px"  alt="appwrite logo"/> by <a href="https://github.com/itznotabug" target="_blank"><b>@ItzNotABug</b></a>',
        },
    },
    vite: {
        server: { host: '0.0.0.0' },
        preview: { host: '0.0.0.0' },
    },
});
