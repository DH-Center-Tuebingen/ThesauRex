<template>
    <div class="col-md-4 offset-md-4 py-5">
        <div class="login-header mb-3">
            <h1>ThesauRex</h1>
            <img
                src="img/logo.png"
                width="100"
            />
        </div>
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">
                    {{ t('global.login_title') }}
                </h5>
                <h6 class="card-subtitle mb-2 text-muted">
                    {{ t('global.login_subtitle') }}
                </h6>
                <div class="card-text">
                    <form @submit.prevent="login">
                        <div class="mb-2">
                            <label
                                for="email"
                                class=" col-form-label"
                            >
                                {{ t('global.email_or_nick') }}
                                <i class="fas fa-fw fa-user"></i>
                            </label>

                            <div class="">
                                <input
                                    id="email"
                                    type="text"
                                    class="form-control"
                                    :class="getValidClass(state.error, 'email|nickname|global')"
                                    v-model="state.user.email"
                                    name="email"
                                    required
                                    autofocus
                                >
                            </div>
                        </div>

                        <div class="mb-2">
                            <label
                                for="password"
                                class=" col-form-label"
                            >
                                {{ t('global.password') }}
                                <i class="fas fa-fw fa-unlock-alt"></i>
                            </label>

                            <div class="">
                                <input
                                    id="password"
                                    type="password"
                                    class="form-control"
                                    :class="getValidClass(state.error, 'password|global')"
                                    v-model="state.user.password"
                                    name="password"
                                    required
                                >
                            </div>
                        </div>

                        <div
                            class="mb-2"
                            v-if="state.error.global"
                        >
                            <div class=" text-danger small">
                                {{ state.error.global }}
                            </div>
                        </div>

                        <div>
                            <div>
                                <button
                                    type="submit"
                                    class="btn btn-primary"
                                >
                                    {{ t('global.login') }}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>


<script>
    import {
        reactive,
        onMounted,
        watch,
    } from 'vue';

    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';
    import useUserStore from '@/bootstrap/stores/user.js';

    import {
        getErrorMessages,
        getValidClass,
    } from '@/helpers/helpers.js';
    import { toApp } from '../bootstrap/router';

    export default {
        setup() {
            const { t, locale } = useI18n();
            const route = useRoute();
            const userStore = useUserStore();
            // DATA
            const state = reactive({
                user: {},
                redirect: {
                    name: 'home'
                },
                submitting: false,
                error: {},
            });

            // FUNCTIONS
            const login = async _ => {
                state.submitting = true;
                state.error = {};
                const credentials = {
                    password: state.user.password
                };
                // dirty check if email field should be treated
                // as actual email address or nickname
                if(state.user.email.includes('@')) {
                    credentials.email = state.user.email;
                } else {
                    credentials.nickname = state.user.email;
                }

                try {
                    await userStore.login(credentials)
                    state.error = {};
                } catch(e) {
                    userStore.logout();
                    state.error = getErrorMessages(e);
                }
                state.submitting = false;
            };
            
            onMounted(() => {
                if(userStore.loggedIn) {
                    toApp();
                }
            })
            
            watch(() => userStore.loggedIn, (loggedIn) => {
                if(loggedIn) {
                    toApp();
                }
            });

            // RETURN
            return {
                t,
                state,
                login,
                getValidClass,
            };
        },
    }
</script>
