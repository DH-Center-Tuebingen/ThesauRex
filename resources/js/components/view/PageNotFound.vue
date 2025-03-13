<template>
    <div class="h-100 d-flex align-items-center justify-content-center">
        <div class="mb-5">
            <h1 class="fw-bold">404</h1>
            <h2>{{ t('app.page_not_found.title') }}</h2>
            <p>{{ t('app.page_not_found.description') }}</p>
        </div>
    </div>
</template>

<script>
    import {useI18n} from 'vue-i18n';

    export default {
        setup() {
            const {t} = useI18n();

            return {
                t,
            };
        },
    };
</script>