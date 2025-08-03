<script lang="ts" setup>
import { useData } from 'vitepress';

const { frontmatter } = useData();
</script>

<template>
    <div v-if="frontmatter.status" class="Status">
        <div
            :class="['VPBadge', frontmatter.status.type]"
            v-html="frontmatter.status.text"
        ></div>
    </div>
</template>

<style scoped>
.Status {
    text-align: center;
    margin: 30px 0 -20px 0;
}

.VPBadge {
    padding: 10px 16px;
}

@media (min-width: 960px) {
    .Status {
        text-align: left;
    }
}
</style>
