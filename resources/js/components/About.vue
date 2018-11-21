<template>
    <modal name="about-modal" height="auto" :scrollable="true" @opened="init">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">{{ $t('main.about.title') }}</h5>
                <button type="button" class="close" aria-label="Close" @click="hideAboutModal">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="media">
                    <img class="mr-3" src="/img/logo.png" alt="spacialist logo" width="64px" />
                    <div class="media-body">
                        <h4>Spacialist</h4>
                        {{ $t('main.about.desc') }}
                    </div>
                </div>
                <hr />
                <dl class="row">
                    <dt class="col-md-6 text-right">{{ $t('main.about.release.name') }}</dt>
                    <dd class="col-md-6">
                        {{ version.name }}
                    </dd>
                    <dt class="col-md-6 text-right">{{ $t('main.about.release.time') }}</dt>
                    <dd class="col-md-6">
                        <span id="version-time" data-toggle="popover" :data-content="version.time | datestring" data-trigger="hover" data-placement="bottom">
                            {{ version.time | date(undefined, true) }}
                        </span>
                    </dd>
                    <dt class="col-md-6 text-right">{{ $t('main.about.release.full-name') }}</dt>
                    <dd class="col-md-6">
                        {{ version.full }}
                    </dd>
                </dl>
                <hr />
                <h5>{{ $tc('main.about.contributor', 2) }}</h5>
                <div class="row">
                    <div v-for="contributor in contributors" class="col-md-6">
                        {{ contributor.name }}
                    </div>
                </div>
                <hr />
                <div class="d-flex flex-row justify-content-between">
                    <span v-html="$t('main.about.build-info')">
                    </span>
                    <div>
                        <a href="https://www.facebook.com/esciencecenter" target="_blank">
                            <i class="fab fa-facebook-square fa-2x text-primary"></i>
                        </a>
                        <a href="https://github.com/eScienceCenter/Spacialist" target="_blank">
                            <i class="fab fa-github fa-2x text-dark"></i>
                        </a>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary"     @click="hideAboutModal">
                    {{ $t('global.close')}}
                </button>
            </div>
        </div>
    </modal>
</template>

<script>
    export default {
        mounted() {},
        methods: {
            init() {
                // Enable popovers
                $('#version-time').popover();
            },
            hideAboutModal() {
                this.$modal.hide('about-modal');
            }
        },
        data() {
            return {
                version: {},
                contributors: [
                    {
                        name: 'Vinzenz Rosenkranz'
                    },
                    {
                        name: 'Benjamin Mitzkus'
                    },
                    {
                        name: 'Dirk Seidensticker'
                    },
                    {
                        name: 'Benjamin Glissmann'
                    },
                    {
                        name: 'Michael Derntl'
                    },
                    {
                        name: 'Matthias Lang'
                    }
                ]
            }
        },
        created() {
            $httpQueue.add(() => $http.get('/version').then(response => {
                for(var k in response.data) {
                    Vue.set(this.version, k, response.data[k]);
                }
            }));
        }
    }
</script>
