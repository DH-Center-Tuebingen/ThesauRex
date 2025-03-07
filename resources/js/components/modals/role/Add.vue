<template>
    <vue-final-modal
        class="modal-container modal"
        name="add-role-modal">
        <div class="sp-modal-content sp-modal-content-xs">

            <div class="modal-header">
                <h5 class="modal-title">
                    {{
                        t('settings.role.modal.add.title')
                    }}
                </h5>
                <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
                </button>
            </div>
            <div class="modal-body">
                <form id="newRoleForm" name="newUserForm" role="form" @submit.prevent="onAdd()">
                    <div class="mb-3">
                        <label class="col-form-label col-12" for="name">
                            {{ t('global.name') }}
                            <span class="text-danger">*</span>:
                        </label>
                        <div class="col-12">
                            <input class="form-control" :class="getClassByValidation(v.fields.name.errors)" type="text" id="name" v-model="v.fields.name.value" @input="v.fields.name.handleInput" required />

                            <div class="invalid-feedback">
                                <span v-for="(msg, i) in v.fields.name.errors" :key="i">
                                    {{ msg }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="col-form-label col-12" for="display-name">
                            {{ t('global.display_name') }}
                            <span class="text-danger">*</span>:
                        </label>
                        <div class="col-12">
                            <input class="form-control" :class="getClassByValidation(v.fields.display_name.errors)" type="text" id="display-name" v-model="v.fields.display_name.value" @input="v.fields.display_name.handleInput" required />

                            <div class="invalid-feedback">
                                <span v-for="(msg, i) in v.fields.display_name.errors" :key="i">
                                    {{ msg }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="col-form-label col-12" for="description">
                            {{ t('global.description') }}
                            <span class="text-danger">*</span>:
                        </label>
                        <div class="col-12">
                            <input class="form-control" :class="getClassByValidation(v.fields.description.errors)" type="text" id="description" v-model="v.fields.description.value" @input="v.fields.description.handleInput" required />

                            <div class="invalid-feedback">
                                <span v-for="(msg, i) in v.fields.description.errors" :key="i">
                                    {{ msg }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="col-form-label col-12" for="derive-from">
                            {{ t('settings.role.preset.derive_from_preset') }}:
                        </label>
                        <div class="col-12">
                            <multiselect
                                id="derive-from"
                                v-model="v.fields.derived_from.value"
                                :classes="multiselectResetClasslist"
                                :object="true"
                                :label="'name'"
                                :track-by="'id'"
                                :valueProp="'id'"
                                :mode="'single'"
                                :options="state.rolePresets"
                                :placeholder="t('settings.role.add_permission_placeholder')">
                                    <template v-slot:option="{ option }">
                                        {{ t(`settings.role.preset.${option.name}`) }}
                                    </template>
                                    <template v-slot:singlelabel="{ value }">
                                        <div class="multiselect-single-label">
                                            {{ t(`settings.role.preset.${value.name}`) }}
                                        </div>
                                    </template>
                            </multiselect>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="submit" class="btn btn-outline-success" :disabled="!state.form.dirty || !state.form.valid" form="newRoleForm">
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
        getClassByValidation,
        multiselectResetClasslist,
    } from '@/helpers/helpers.js';

    export default {
        props: {
        },
        emits: ['add', 'cancel'],
        setup(props, context) {
            const { t } = useI18n();

            // FUNCTIONS
            const closeModal = _ => {
                context.emit('cancel', false);
            };
            const onAdd = _ => {
                const role = {
                    name: v.fields.name.value,
                    display_name: v.fields.display_name.value,
                    description: v.fields.description.value,
                    derived_from: v.fields.derived_from.value ? v.fields.derived_from.value.id : null,
                };
                context.emit('add', role);
            };

            // DATA
            const schema = yup.object({
                name: yup.string().required().matches(/^[0-9a-zA-Z-_]+$/).max(255),
                display_name: yup.string().required().max(255),
                description: yup.string().required().max(255),
            });
            const {
                meta: formMeta
            } = useForm({
                validationSchema: schema,
            });
            const {
                errors: en,
                meta: mn,
                value: vn,
                handleChange: hcn,
            } = useField('name');
            const {
                errors: edn,
                meta: mdn,
                value: vdn,
                handleChange: hcdn,
            } = useField('display_name');
            const {
                errors: ed,
                meta: md,
                value: vd,
                handleChange: hcd,
            } = useField('description');

            const state = reactive({
                form: formMeta,
                rolePresets: computed(_ => store.getters.rolePresets),
            });
            const v = reactive({
                fields: {
                    name: {
                        errors: en,
                        meta: mn,
                        value: vn,
                        handleChange: hcn,
                    },
                    display_name: {
                        errors: edn,
                        meta: mdn,
                        value: vdn,
                        handleChange: hcdn,
                    },
                    description: {
                        errors: ed,
                        meta: md,
                        value: vd,
                        handleChange: hcd,
                    },
                    derived_from: {
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
                // PROPS
                // LOCAL
                closeModal,
                onAdd,
                // STATE
                state,
                v,
            }
        },
    }
</script>
