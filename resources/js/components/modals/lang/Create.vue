<template>
    <vue-final-modal
        class="modal-container modal"
        name="create-language-modal">
        <div class="sp-modal-content sp-modal-content-xs">
            <div class="modal-header">
                <h5 class="modal-title">
                    {{
                        t('modals.language.add.title')
                    }}
                </h5>
                <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
                </button>
            </div>
            <div class="modal-body nonscrollable">
                <form id="add-language-form" name="add-language-form" role="form" @submit.prevent="onAdd()">
                    <div class="mb-3">
                        <label class="col-form-label col-12" for="display_name">
                            {{ t('global.display_name') }}
                            <span class="text-danger">*</span>:
                        </label>
                        <div class="col-12">
                            <input class="form-control" :class="getClassByValidation(v.fields.display_name.errors)" type="text" id="display_name" v-model="v.fields.display_name.value" @input="v.fields.display_name.handleInput" required />

                            <div class="invalid-feedback">
                                <span v-for="(msg, i) in v.fields.display_name.errors" :key="i">
                                    {{ msg }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="col-form-label col-12" for="add-language-selection">
                            {{ t('global.short_name') }}
                            <span class="text-danger">*</span>:
                        </label>
                        <div class="col-12">
                            <multiselect
                                id="add-language-selection"
                                v-model="v.fields.short_name.value"
                                :classes="multiselectResetClasslist"
                                :object="true"
                                :label="'name'"
                                :track-by="'id'"
                                :valueProp="'id'"
                                :mode="'single'"
                                :searchable="true"
                                :filterResults="false"
                                :options="state.selectableLanguages"
                                :placeholder="t('modals.language.add.placeholder')"
                                @search-change="searchList">
                                    <template v-slot:option="{ option }">
                                        <div class="d-flex gap-2">
                                            {{ emojiFlag(option.code) }}
                                            <span>
                                                {{ option.label }}
                                                <span class="text-muted">
                                                    -
                                                    {{ option.code }}
                                                </span>
                                            </span>
                                        </div>
                                    </template>
                                    <template v-slot:singlelabel="{ value }">
                                        <div class="multiselect-single-label d-flex gap-2">
                                            {{ emojiFlag(value.code) }}
                                            <span>
                                                {{ value.code }}
                                            </span>
                                        </div>
                                    </template>
                            </multiselect>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-outline-success" :disabled="!isValidated()" form="add-language-form">
                    <i class="fas fa-fw fa-plus"></i> {{ t('global.add') }}
                </button>
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" @click="closeModal()">
                    <i class="fas fa-fw fa-times"></i> {{ t('global.cancel') }}
                </button>
            </div>
        </div>
    </vue-final-modal>
</template>

<script>
    import {
        computed,
        onMounted,
        reactive,
    } from 'vue';

    import { useI18n } from 'vue-i18n';
    import { useForm, useField } from 'vee-validate';
    import * as yup from 'yup';

    import store from '@/bootstrap/store.js';

    import {
        languageList,
    } from '@/helpers/helpers.js';

    import {
        getClassByValidation,
        multiselectResetClasslist,
        emojiFlag,
    } from '@/helpers/helpers.js';

    export default {
        props: {
        },
        emits: ['add', 'cancel'],
        setup(props, context) {
            const { t } = useI18n();

            // FUNCTIONS
            const isValidated = _ => {
                return (state.form.dirty && state.form.valid) && (v.fields.short_name.value && v.fields.short_name.value.id);
            };
            const closeModal = _ => {
                context.emit('cancel', false);
            };
            const onAdd = _ => {
                if(!isValidated()) return;

                const language = {
                    display_name: v.fields.display_name.value,
                    short_name: v.fields.short_name.value.code,
                };
                context.emit('add', language);
            };
            const searchList = (query, sel) => {
                state.query = query.trim().toLowerCase();
            };

            // DATA
            const schema = yup.object({
                display_name: yup.string().required().max(255),
            });
            const {
                meta: formMeta
            } = useForm({
                validationSchema: schema,
            });
            const {
                errors: edn,
                meta: mdn,
                value: vdn,
                handleChange: hcdn,
            } = useField('display_name');

            const fullLanguageList = languageList();
            const state = reactive({
                form: formMeta,
                addedLanguagesIds: computed(_ => store.getters.languages.map(l => l.id)),
                query: '',
                languageList: computed(_ => fullLanguageList.filter(l => {
                    return !state.addedLanguagesIds.includes(l.id);
                })),
                selectableLanguages: computed(_ => {
                    if(state.query == '') {
                        return state.languageList;
                    }
                    const list = state.languageList.filter(l => {
                        const code = l.code.toLowerCase();
                        const label = l.label.toLowerCase();
                        return code.includes(state.query) || label.includes(state.query);
                    });
                    return list;
                }),
            });
            const v = reactive({
                fields: {
                    display_name: {
                        errors: edn,
                        meta: mdn,
                        value: vdn,
                        handleChange: hcdn,
                    },
                    short_name: {
                        value: null,
                    },
                },
                schema: schema,
            });

            // ON MOUNTED
            onMounted(_ => {
            });

            // RETURN
            return {
                t,
                // HELPERS
                getClassByValidation,
                multiselectResetClasslist,
                emojiFlag,
                // PROPS
                // LOCAL
                isValidated,
                closeModal,
                onAdd,
                searchList,
                // STATE
                state,
                v,
            };
        },
    }
</script>
