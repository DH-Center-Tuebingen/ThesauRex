<template>
    <div class="col-md-4 offset-md-4">
        <div class="login-header mb-3">
            <h1>ThesauRex</h1>
            <!-- <img src="img/logo.png" width="100px;" /> -->
        </div>
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">
                    {{ $t('global.login-title') }}
                </h5>
                <h6 class="card-subtitle mb-2 text-muted">
                    {{ $t('global.login-subtitle') }}
                </h6>
                <p class="card-text">
                    <form @submit.prevent="login">
                        <div class="form-group">
                            <label for="email" class="col-md-4 col-form-label">
                                {{ $t('global.email_or_nick') }}
                                <i class="fas fa-fw fa-user"></i>
                            </label>

                            <div class="col-md-6">
                                <input id="email" type="text" class="form-control" :class="$getValidClass(error, 'email|nickname')"  v-model="user.email" name="email" required autofocus>

                                <div class="invalid-feedback">
                                    <span v-for="msg in error.email">
                                        {{ msg }}
                                    </span>
                                    <span v-for="msg in error.nickname">
                                        {{ msg }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="password" class="col-md-4 col-form-label">
                                {{ $t('global.password') }}
                                <i class="fas fa-fw fa-unlock-alt"></i>
                            </label>

                            <div class="col-md-6">
                                <input id="password" type="password" class="form-control" :class="$getValidClass(error, 'password')" v-model="user.password" name="password" required>

                                <div class="invalid-feedback">
                                    <span v-for="msg in error.password">
                                        {{ msg }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="col-md-6 col-md-offset-4">
                                <div class="checkbox">
                                    <label>
                                        <input type="checkbox" name="remember" v-model="user.remember"> {{ $t('global.remember-me') }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="col-md-8 col-md-offset-4">
                                <button type="submit" class="btn btn-primary">
                                    {{ $t('global.login') }}
                                </button>
                            </div>
                        </div>
                    </form>
                </p>
            </div>
        </div>
    </div>
</template>


<script>
    export default {
        props: {
            onLogin: {
                required: false,
                type: Function
            }
        },
        mounted() {
            if(this.$auth.check()) {
                this.$router.push({
                    name: 'home'
                });
            }
            let lastRoute = this.$auth.redirect() ? this.$auth.redirect().from : undefined;
            if(lastRoute && lastRoute.name != 'login') {
                this.redirect = {
                    name: lastRoute.name,
                    params: lastRoute.params,
                    query: lastRoute.query
                };
            } else if(this.$router.currentRoute.query && this.$router.currentRoute.query.redirect) {
                this.redirect = {
                    path: this.$router.currentRoute.query.redirect
                };
            }
        },
        methods: {
            login() {
                const vm = this;
                let data = {
                    password: vm.user.password
                };
                // dirty check if email field should be treated
                // as actual email address or nickname
                if(vm.user.email.includes('@')) {
                    data.email = vm.user.email;
                } else {
                    data.nickname = vm.user.email;
                }
                vm.$auth.login({
                    data: data,
                    staySignedIn: vm.user.remember,
                    redirect: vm.redirect,
                    fetchUser: true
                }).then(_ => {
                    vm.error = {};
                    if(vm.onLogin) {
                        vm.onLogin();
                    }
                }, e => {
                    vm.$getErrorMessages(e, vm.error);
                });
            }
        },
        data() {
            return {
                user: {},
                redirect: {
                    name: 'home'
                },
                error: {}
            }
        }
    }
</script>
