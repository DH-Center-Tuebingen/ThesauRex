<template>
    <vue-final-modal
        classes="modal-container"
        content-class="sp-modal-content sp-modal-content-sm"
        v-model="state.show"
        name="about-modal">
        <div class="modal-header">
            <h5 class="modal-title">
                {{
                    t('settings.about.title')
                }}
            </h5>
            <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
            </button>
        </div>
        <div class="modal-body">
            <div class="d-flex">
                <div class="flex-shrink-0">
                    <img class="me-3" src="/img/logo.png" alt="spacialist logo" width="64" />
                </div>
                <div class="flex-grow-1 ps-3">
                    <h4>ThesauRex</h4>
                    {{ t('settings.about.desc') }}
                </div>
            </div>
            <hr />
            <dl class="row">
                <dt class="col-md-6 text-end">{{ t('settings.about.release.name') }}</dt>
                <dd class="col-md-6">
                    {{ state.version.name }}
                </dd>
                <dt class="col-md-6 text-end">{{ t('settings.about.release.time') }}</dt>
                <dd class="col-md-6">
                    <span id="version-time" data-bs-toggle="popover" :data-content="datestring(state.version.time)" data-trigger="hover" data-placement="bottom">
                        {{ date(state.version.time) }}
                    </span>
                </dd>
                <dt class="col-md-6 text-end">{{ t('settings.about.release.full_name') }}</dt>
                <dd class="col-md-6">
                    {{ state.version.full }}
                </dd>
            </dl>
            <hr />
            <h5>{{ t('settings.about.contributor', 2) }}</h5>
            <div class="row gy-1">
                <div v-for="contributor in contributors" class="col-md-6 d-flex flex-column align-items-start" :key="contributor.name">
                    <span>
                        {{ contributor.name }}
                    </span>
                    <span class="badge bg-primary">
                        {{ transJoin(contributor.roles) }}
                    </span>
                </div>
            </div>
            <hr />
            <div class="d-flex flex-row justify-content-between">
                <span v-html="t('settings.about.build_info')">
                </span>
                <div>
                    <a href="https://www.facebook.com/esciencecenter" target="_blank">
                        <i class="fab fa-facebook-square fa-2x text-primary"></i>
                    </a>
                    <a href="https://github.com/DH-Center-Tuebingen/Spacialist" target="_blank" class="ms-2">
                        <i class="fab fa-github fa-2x text-dark"></i>
                    </a>
                </div>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" @click="closeModal()">
                <i class="fas fa-fw fa-times"></i> {{ t('global.close') }}
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

    import store from '@/bootstrap/store.js';

    import {
        date,
        datestring,
        join,
    } from '@/helpers/filters.js';

    import {
        getContributors,
    } from '@/helpers/globals.js';

    export default {
        emits: ['closing'],
        setup(props, context) {
            const { t } = useI18n();

            // FUNCTIONS
            const closeModal = _ => {
                state.show = false;
                context.emit('closing', false);
            }
            const transJoin = roles => {
                return join(roles.map(rn => t(`settings.about.roles.${rn}`)));
            }

            // DATA
            const contributors = getContributors();
            const state = reactive({
                show: false,
                version: computed(_ => store.getters.version),
            });

            // ON MOUNTED
            onMounted(_ => {
                state.show = true;
            });

            // RETURN
            return {
                t,
                // HELPERS
                date,
                datestring,
                // PROPS
                // LOCAL
                contributors,
                closeModal,
                transJoin,
                // STATE
                state,
            }
        },
    }
</script>
