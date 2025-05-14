<template>
    <div class="view h-100 d-flex align-items-center justify-content-center">
        <div class="mb-2">
            <h1
                class="text-center fw-bold"
                style="font-size:max(7rem, 20vh);margin-bottom: 5vh;"
            >404</h1>
            <h3>{{ t('global.page_not_found.title') }}</h3>
            <p>{{ t('global.page_not_found.message') }}</p>
            <RouterLink :to="{ name: 'home' }">
                <button class="btn btn-primary mt-3">
                    {{ t('global.page_not_found.back') }}
                </button>
            </RouterLink>
        </div>
    </div>
</template>

<script>
    import { useI18n } from 'vue-i18n';
    import { RouterLink, useRoute } from 'vue-router';

    export default {
        setup() {
            const { t } = useI18n();
            const route = useRoute();
            return {
                t: t,
                route: route,
            }
        }
    }
</script>