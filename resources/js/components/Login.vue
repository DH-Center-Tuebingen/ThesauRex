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
                                {{ $t('global.email') }}
                                <i class="fas fa-fw fa-envelope"></i>
                            </label>

                            <div class="col-md-6">
                                <input id="email" type="email" class="form-control" v-model="user.email" name="email" required autofocus>

                                <!-- @if ($errors->has('email'))
                                    <span class="help-block">
                                        <strong>{{ $errors->first('email') }}</strong>
                                    </span>
                                @endif -->
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="password" class="col-md-4 col-form-label">
                                {{ $t('global.password') }}
                                <i class="fas fa-fw fa-unlock-alt"></i>
                            </label>

                            <div class="col-md-6">
                                <input id="password" type="password" class="form-control" v-model="user.password" name="password" required>

                                <!-- @if ($errors->has('password'))
                                    <span class="help-block">
                                        <strong>{{ $errors->first('password') }}</strong>
                                    </span>
                                @endif -->
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
                vm.$auth.login({
                    data: {
                        email: vm.user.email,
                        password: vm.user.password
                    },
                    rememberMe: vm.user.remember,
                    redirect: vm.redirect,
                    success: _ => {
                        if(vm.onLogin) {
                            vm.onLogin();
                        }
                    },
                    fetchUser: true
                });
            }
        },
        data() {
            return {
                user: {},
                redirect: {
                    name: 'home'
                }
            }
        }
    }
</script>
