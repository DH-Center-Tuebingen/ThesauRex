<template>
    <div>
        <h1>Spinning</h1>
        <p>
            <Login
                v-model:username="state.username"
                v-model:password="state.password"
                :loading="state.loading"
                title="Login"
                submitText="Submit"
            />
        </p>
    </div>
</template>

<script>
    import { Login } from 'dhc-components';
    import { reactive } from 'vue';
    import { useI18n } from 'vue-i18n';

    export default {
        components: {
            Login,
        },
        setup() {

            const state = reactive({
                username: '',
                password: '',
                loading: false,
            });

            return {
                t: useI18n().t,
                state,
            }
        }
    }
</script>