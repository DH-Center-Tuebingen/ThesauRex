<template>
    <div
        class="col-md-4 offset-md-4 mx-auto"
        style="max-width: 420px;"
    >
        <div class="login-header my-5">

            <img
                src="img/logo.png"
                width="100"
            />
            <h1 class="mt-4 fw-bold">ThesauRex</h1>
        </div>
        <div class="card p-3">
            <div class="card-body">
                <h2 class="fw-bold card-title mb-4">
                    {{ t('global.login_title') }}
                </h2>



                <p class="card-text">
                <form
                    @submit.prevent="login"
                    class="d-flex flex-column gap-2"
                >
                    <div class="mb-2">
                        <label
                            for="email"
                            class="mb-2"
                        >
                            <i class="text-muted fas fa-fw fa-user me-2"></i>
                            {{ t('global.email_or_nick') }}
                        </label>

                        <input
                            id="email"
                            type="text"
                            class="form-control"
                            :class="getValidClass(state.error, 'email|nickname|global')"
                            v-model="state.user.email"
                            name="email"
                            autocomplete="username"
                            required
                            autofocus
                        >
                    </div>

                    <div>
                        <label
                            for="password"
                            class="mb-2"
                        >
                            <i class="text-muted fas fa-fw fa-unlock-alt me-2"></i>
                            {{ t('global.password') }}
                        </label>

                        <input
                            id="password"
                            type="password"
                            class="form-control"
                            :class="getValidClass(state.error, 'password|global')"
                            v-model="state.user.password"
                            name="password"
                            autocomplete="current-password"
                            required
                        >
                    </div>

                    <div class="mt-3">
                        <Alert
                            v-if="state.error.global"
                            type="error"
                            :message="state.error.global"
                            :noicon="false"
                        />
                    </div>

                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <div class="checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        v-model="state.user.remember"
                                    > {{ t('global.remember_me') }}
                                </label>
                            </div>
                        </div>

                        <LoadingButton
                            class="btn btn-primary"
                            :loading="state.loading"
                        >
                            {{ t('global.login') }}
                        </LoadingButton>
                    </div>


                </form>
                </p>
            </div>
        </div>
    </div>
</template>


<script>
    import {
        computed,
        reactive,
        onMounted,
    } from 'vue';

    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';
    import auth from '@/bootstrap/auth.js';
    import router from '@/bootstrap/router.js';

    import {
        initApp,
        getErrorMessages,
        getValidClass
    } from '@/helpers/helpers.js';

    import LoadingButton from '@/components/form/LoadingButton.vue';
    import Alert from './Alert.vue';

    export default {
        components: {
            Alert,
            LoadingButton,
        },
        setup() {
            const { t, locale } = useI18n();
            // DATA
            const state = reactive({
                user: {},
                disabled: computed(_ => !state.user.email || !state.user.password),
                loading: false,
                redirect: {
                    name: 'home'
                },
                error: {},
            });

            // FUNCTIONS
            const login = async _ => {
                state.loading = true;
                state.error = {};

                let data = {
                    password: state.user.password
                };
                // dirty check if email field should be treated
                // as actual email address or nickname
                if (state.user.email.includes('@')) {
                    data.email = state.user.email;
                } else {
                    data.nickname = state.user.email;
                }

                try {
                    await auth.login({
                        data: data,
                        staySignedIn: state.user.remember,
                        redirect: state.redirect,
                        fetchUser: true
                    })
                    initApp(locale)
                } catch (e) {
                    state.error = getErrorMessages(e);
                }
                state.loading = false;
            };

            // ON MOUNTED
            onMounted(_ => {
                if (auth.check()) {
                    router.push({
                        name: 'home'
                    });
                }
                const lastRoute = auth.redirect() ? auth.redirect().from : undefined;
                const currentRoute = useRoute();
                if (lastRoute && lastRoute.name != 'login') {
                    state.redirect = {
                        name: lastRoute.name,
                        params: lastRoute.params,
                        query: lastRoute.query
                    };
                } else if (currentRoute.query && currentRoute.query.redirect) {
                    state.redirect = {
                        path: currentRoute.query.redirect
                    };
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
