<template>
    <div
        class="row mb-3"
        :title="t('settings.preference.tooltip.missing_labels')"
    >
        <label class="col-md-2 form-label text-end">
            {{ t('settings.preference.key.import_keys.ignore_missing_labels') }}
        </label>
        <div class="col-md-10">
            <div class="form-check form-switch">
                <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="state.ignoreLabels"
                    :readonly="readonly"
                    :disabled="readonly || state.skipLabels"
                    @input="onChange"
                >
            </div>
        </div>
    </div>
    <div
        class="row mb-3"
        :title="t('settings.preference.tooltip.skip_labels')"
    >
        <label class="col-md-2 form-label text-end">
            {{ t('settings.preference.key.import_keys.skip_missing_labels') }}
        </label>
        <div class="col-md-10">
            <div class="form-check form-switch">
                <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="state.skipLabels"
                    :readonly="readonly"
                    :disabled="readonly"
                    @input="onChange"
                >
            </div>
        </div>
    </div>
    <div
        class="row mb-3"
        :title="t('settings.preference.tooltip.missing_languages')"
    >
        <label class="col-md-2 form-label text-end">
            {{ t('settings.preference.key.import_keys.ignore_missing_languages') }}
        </label>
        <div class="col-md-10">
            <div class="form-check form-switch">
                <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="state.ignoreLanguages"
                    :readonly="readonly"
                    :disabled="readonly"
                    @input="onChange"
                >
            </div>
        </div>
    </div>
    <div
        class="row"
        :title="t('settings.preference.tooltip.missing_relations')"
    >
        <label class="col-md-2 form-label text-end">
            {{ t('settings.preference.key.import_keys.ignore_missing_relations') }}
        </label>
        <div class="col-md-10">
            <div class="form-check form-switch">
                <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="state.ignoreRelations"
                    :readonly="readonly"
                    :disabled="readonly"
                    @input="onChange"
                >
            </div>
        </div>
    </div>
</template>

<script>
    import {
        reactive,
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import {
        debounce
    } from '@/helpers/helpers.js';

    export default {
        props: {
            data: {
                required: true,
                type: Object,
            },
            readonly: {
                required: false,
                type: Boolean,
                default: false,
            },
        },
        emits: ['changed'],
        setup(props, context) {
            const { t } = useI18n();

            // FUNCTIONS
            const onChange = debounce(e => {
                if(props.readonly) return;
                context.emit('changed', {
                    value: {
                        skip_missing_labels: state.skipLabels,
                        ignore_missing_labels: state.ignoreLabels,
                        ignore_missing_languages: state.ignoreLanguages,
                        ignore_missing_relations: state.ignoreRelations,
                    }
                });
            }, 250);

            // DATA
            const state = reactive({
                skipLabels: props.data.skip_missing_labels,
                ignoreLabels: props.data.ignore_missing_labels,
                ignoreLanguages: props.data.ignore_missing_languages,
                ignoreRelations: props.data.ignore_missing_relations,
            });

            // RETURN
            return {
                t,
                // LOCAL
                onChange,
                // STATE
                state,
            };
        }
    }
</script>
