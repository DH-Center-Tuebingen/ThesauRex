<template>
    <div class="row">
        <label class="col-md-2 form-label"></label>
        <div class="col-md-10">
            <multiselect
                v-model="data"
                id="language-search"
                :hideSelected="true"
                :mode="'single'"
                :filterResults="true"
                :options="state.languageList"
                :searchable="true"
                :readonly="readonly"
                :placeholder="t('global.select.placeholder')"
                @change="onChange">
            </multiselect>
            <button type="button" class="btn btn-outline-primary mt-2" @click="setBrowserLanguage()" :disabled="readonly" v-if="state.showSetButton" v-html="t('settings.preference.info.set_to_language', {lang: state.browserLanguage})" />
        </div>
    </div>
</template>

<script>
    import {
        computed,
        reactive,
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import {
        getSupportedLanguages,
    } from '@/bootstrap/i18n.js';

    export default {
        props: {
            data: {
                required: true,
                type: String,
            },
            readonly: {
                required: false,
                type: Boolean,
                default: false,
            },
            browserDefault: {
                required: false,
                type: Boolean,
                default: false,
            },
        },
        emits: ['changed'],
        setup(props, context) {
            const { t } = useI18n();
            const {
                data,
                readonly,
                browserDefault,
            } = toRefs(props);

            // FUNCTIONS
            const onChange = value => {
                if(readonly.value) return;
                context.emit('changed', {
                    value: value
                });
            };
            const setBrowserLanguage = _ => {
                if(!browserDefault.value || readonly.value) return;

                onChange(state.browserLanguage);
            };

            // DATA
            const state = reactive({
                languageList: getSupportedLanguages(),
                browserLanguage: computed(_ => navigator.language ? navigator.language.split('-')[0] : 'en'),
                showSetButton: computed(_ => {
                    return browserDefault.value && state.browserLanguage != data.value && state.languageList.includes(state.browserLanguage);
                }),
            });

            // RETURN
            return {
                t,
                // LOCAL
                onChange,
                setBrowserLanguage,
                // PROPS
                data,
                readonly,
                // STATE
                state,
            };
        }
    }
</script>
