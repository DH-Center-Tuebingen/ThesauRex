<template>
    <div
        class="col-md-4 offset-md-4 mx-auto"
        style="max-width: 420px;"
    >
        <div class="login-header my-5">

            <img
                src="img/logo.svg"
                width="128"
            />
            <h1 class="mt-4 fw-bold">ThesauRex</h1>

            <Login 
                :loading="state.loading"
                :disabled="state.disabled"
                v-model:username="state.user.email"
                v-model:password="state.user.password"
                @login="login"
                :error="state.error"
                :errorMessage="state.errorMessage"
                :passwordLabel="{text: 'Password', icon: 'fas fa-lock'}"
                :userLabel="{text: 'Email or Nickname', icon: 'fas fa-lock'}"
                :submitText="'Login'"
                :stayLoggedIn="{text: 'Stay logged in', }"

            />
        </div>
      
    </div>
</template>


<script>
    import {
        computed,
        reactive,
        onMounted,
    } from 'vue';

    import Login from 'dhc-components/Login'

    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';
    import auth from '@/bootstrap/auth.js';
    import router from '@/bootstrap/router.js';

    import {
        initApp,
        getErrorMessages,
        getValidClass
    } from '@/helpers/helpers.js';

    // import Alert from './Alert.vue';

    export default {
        components: {
            Login,
        },
        setup() {
            const { t, locale } = useI18n();
            // DATA
            const state = reactive({
                user: {
                    email: '',
                    password: '',
                },
                disabled: computed(_ => !state.user.email || !state.user.password),
                loading: false,
                redirect: {
                    name: 'home'
                },
                error: false,
                errorMessage: {
                    type: '',
                    message: '',
                }
            });

            // FUNCTIONS
            const login = async _ => {
                state.loading = true;
                state.error = false;

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
                    state.error = true;
                    const errorObject = getErrorMessages(e);
                    state.errorMessage = {
                        type: 'error',
                        text: Object.values(errorObject).join(' ::: ')
                    }; 
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
