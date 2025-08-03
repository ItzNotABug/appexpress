import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import Status from './components/status/StatusUpdate.vue';

import './style.css';

export default {
    extends: DefaultTheme,
    Layout: () => {
        return h(DefaultTheme.Layout, null, {
            'home-hero-actions-after': () => h(Status),
        });
    },
} satisfies Theme;
