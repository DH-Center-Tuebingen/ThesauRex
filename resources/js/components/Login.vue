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
        </div>
        <Login
            :loading="state.loading"
            @login="login"
            :error="state.errorMessage"
        />
    </div>
</template>


<script>
    import {
        computed,
        reactive,
        onMounted,
    } from 'vue';

    import { Login } from 'dhc-components'

    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';
    import auth from '@/bootstrap/auth.js';
    import router from '@/bootstrap/router.js';

    import {
        initApp,
        getErrorMessages,
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
                errorMessage: '',
            });

            // FUNCTIONS
            const login = async args => {
                state.loading = true;

                let data = {
                    password: args.password
                };
                // dirty check if email field should be treated
                // as actual email address or nickname
                if(args.username.includes('@')) {
                    data.email = args.username;
                } else {
                    data.nickname = args.username;
                }

                try {
                    await auth.login({
                        data,
                        staySignedIn: args.staySignedIn,
                        redirect: state.redirect,
                        fetchUser: true
                    })
                    initApp(locale)
                } catch(e) {
                    const errorObject = getErrorMessages(e);
                    state.errorMessage = Object.values(errorObject).join(' ::: ');
                }
                state.loading = false;
            };

            // ON MOUNTED
            onMounted(_ => {
                if(auth.check()) {
                    router.push({
                        name: 'home'
                    });
                }
                const lastRoute = auth.redirect() ? auth.redirect().from : undefined;
                const currentRoute = useRoute();
                if(lastRoute && lastRoute.name != 'login') {
                    state.redirect = {
                        name: lastRoute.name,
                        params: lastRoute.params,
                        query: lastRoute.query
                    };
                } else if(currentRoute.query && currentRoute.query.redirect) {
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
            };
        },
    }
</script>
