<template>
    <tr>
        <th>{{ t('global.name') }}</th>
        <th>{{ t('global.email') }}</th>
        <th>{{ t('global.roles') }}</th>
        <th>{{ t('global.added_at') }}</th>
        <th>{{ t('global.updated_at') }}</th>
        <th></th>
    </tr>
</template>

<script>
import { useI18n } from 'vue-i18n';
export default {
    setup() {
        const { t } = useI18n();

        return {
            t,
        };
    },
}
</script>