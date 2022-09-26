<template>
  <vue-final-modal
    classes="modal-container modal"
    content-class="sp-modal-content sp-modal-content-xs"
    v-model="state.show"
    name="add-user-modal">
    <div class="modal-header">
        <h5 class="modal-title">
            {{
                t('settings.user.modal.add.title')
            }}
        </h5>
        <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
        </button>
    </div>
    <div class="modal-body">
        <form id="newUserForm" name="newUserForm" role="form" @submit.prevent="onAdd()">
            <div class="mb-3">
                <label class="col-form-label col-12" for="name">
                    {{ t('global.name') }}
                    <span class="text-danger">*</span>:
                </label>
                <div class="col-12">
                    <input class="form-control" :class="getClassByValidation(v.fields.name.errors)" type="text" id="name" v-model="v.fields.name.value" @input="v.fields.name.handleChange" required />

                    <div class="invalid-feedback">
                        <span v-for="(msg, i) in v.fields.name.errors" :key="i">
                            {{ msg }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="col-form-label col-12" for="nickname">
                    {{ t('global.nickname') }}
                    <span class="text-danger">*</span>:
                </label>
                <div class="col-12">
                    <input class="form-control" :class="getClassByValidation(v.fields.nickname.errors)" type="text" id="nickname" v-model="v.fields.nickname.value" @input="v.fields.nickname.handleChange" required />

                    <div class="invalid-feedback">
                        <span v-for="(msg, i) in v.fields.nickname.errors" :key="i">
                            {{ msg }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="col-form-label col-12" for="email">
                    {{ t('global.email') }}
                    <span class="text-danger">*</span>:
                </label>
                <div class="col-12">
                    <input class="form-control" :class="getClassByValidation(v.fields.email.errors)" type="email" id="email" v-model="v.fields.email.value" @input="v.fields.email.handleChange" required />

                    <div class="invalid-feedback">
                        <span v-for="(msg, i) in v.fields.email.errors" :key="i">
                            {{ msg }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="col-form-label col-12" for="password">
                    {{ t('global.password') }}
                    <span class="text-danger">*</span>:
                </label>
                <div class="col-12">
                    <input class="form-control d-inline" :class="getClassByValidation(v.fields.password.errors)" type="password" id="password" v-model="v.fields.password.value" @input="v.fields.password.handleChange" required />
                    <a href="#" class="text-muted ms--4-5" @click.prevent="togglePasswordVisibility()">
                        <span v-show="!state.showPassword">
                            <i class="fas fa-fw fa-eye"></i>
                        </span>
                        <span v-show="state.showPassword">
                            <i class="fas fa-fw fa-eye-slash"></i>
                        </span>
                    </a>

                    <div class="invalid-feedback">
                        <span v-for="(msg, i) in v.fields.password.errors" :key="i">
                            {{ msg }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="mb-3">
                <label class="col-form-label col-12" for="password_confirm">
                    {{ t('global.confirm_password') }}
                    <span class="text-danger">*</span>:
                </label>
                <div class="col-12">
                    <input class="form-control" :class="getClassByValidation(v.fields.password_confirm.errors)" type="password" id="password_confirm" v-model="v.fields.password_confirm.value" @input="v.fields.password_confirm.handleChange" required />

                    <div class="invalid-feedback">
                        <span v-for="(msg, i) in v.fields.password_confirm.errors" :key="i">
                            {{ msg }}
                        </span>
                    </div>
                </div>
            </div>
        </form>
    </div>
    <div class="modal-footer">
        <button type="submit" class="btn btn-outline-success" :disabled="!state.form.dirty || !state.form.valid" form="newUserForm">
            <i class="fas fa-fw fa-plus"></i> {{ t('global.add') }}
        </button>
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" @click="closeModal()">
            <i class="fas fa-fw fa-times"></i> {{ t('global.cancel') }}
        </button>
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

    import {
        can,
        getClassByValidation,
    } from '@/helpers/helpers.js';

    export default {
        props: {
        },
        emits: ['add', 'cancel'],
        setup(props, context) {
            const { t } = useI18n();

            // FUNCTIONS
            const closeModal = _ => {
                state.show = false;
                context.emit('cancel', false);
            };
            const onAdd = _ => {
                state.show = false;
                const user = {
                    name: v.fields.name.value,
                    nickname: v.fields.nickname.value,
                    email: v.fields.email.value,
                    password: v.fields.password.value,
                };
                context.emit('add', user);
            };
            const togglePasswordVisibility = _ => {
                state.showPassword = !state.showPassword;

                const pw = document.getElementById('password');
                const pwc = document.getElementById('password_confirm');
                const type = state.showPassword ? 'text' : 'password';
                pw.setAttribute('type', type);
                pwc.setAttribute('type', type);
            };

            // DATA
            const schema = yup.object({
                name: yup.string().required().max(255),
                nickname: yup.string().required().matches(/^[0-9a-zA-Z-_]+$/).max(255),
                email: yup.string().required().email().max(255),
                password: yup.string().required().min(6),
                password_confirm: yup.string().oneOf([yup.ref('password'), null]).required(),
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
                errors: enn,
                meta: mnn,
                value: vnn,
                handleChange: hcnn,
            } = useField('nickname');
            const {
                errors: ee,
                meta: me,
                value: ve,
                handleChange: hce,
            } = useField('email');
            const {
                errors: ep,
                meta: mp,
                value: vp,
                handleChange: hcp,
            } = useField('password');
            const {
                errors: epc,
                meta: mpc,
                value: vpc,
                handleChange: hcpc,
            } = useField('password_confirm');

            const state = reactive({
                show: false,
                showPassword: false,
                form: formMeta,
            });
            const v = reactive({
                fields: {
                    name: {
                        errors: en,
                        meta: mn,
                        value: vn,
                        handleChange: hcn,
                    },
                    nickname: {
                        errors: enn,
                        meta: mnn,
                        value: vnn,
                        handleChange: hcnn,
                    },
                    email: {
                        errors: ee,
                        meta: me,
                        value: ve,
                        handleChange: hce,
                    },
                    password: {
                        errors: ep,
                        meta: mp,
                        value: vp,
                        handleChange: hcp,
                    },
                    password_confirm: {
                        errors: epc,
                        meta: mpc,
                        value: vpc,
                        handleChange: hcpc,
                    },
                },
                schema: schema,
            });

            // ON MOUNTED
            onMounted(_ => {
                state.show = true;
            });

            // RETURN
            return {
                t,
                // HELPERS
                getClassByValidation,
                // PROPS
                // LOCAL
                closeModal,
                onAdd,
                togglePasswordVisibility,
                // STATE
                state,
                v,
            }
        },
    }
</script>
