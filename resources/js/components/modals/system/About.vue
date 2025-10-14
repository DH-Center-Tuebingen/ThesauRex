<template>
    <vue-final-modal
        class="modal-container modal"
        name="about-modal"
    >
        <div class="sp-modal-content sp-modal-content-sm">
            <div class="modal-body">
                <div class="d-flex">
                    <div class="flex-shrink-0">
                        <img
                            class="me-3"
                            src="/img/logo.png"
                            alt="spacialist logo"
                            width="64"
                        />
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
                        {{ systemStore.version.name }}
                    </dd>
                    <dt class="col-md-6 text-end">{{ t('settings.about.release.time') }}</dt>
                    <dd class="col-md-6">
                        <span
                            id="version-time"
                            data-bs-toggle="popover"
                            :data-content="datestring(systemStore.version.time)"
                            data-trigger="hover"
                            data-placement="bottom"
                        >
                            {{ date(systemStore.version.time) }}
                        </span>
                    </dd>
                    <dt class="col-md-6 text-end">{{ t('settings.about.release.full_name') }}</dt>
                    <dd class="col-md-6">
                        {{ systemStore.version.full }}
                    </dd>
                </dl>
                <hr />
                <h5>{{ t('settings.about.contributor', 2) }}</h5>
                <div class="row gy-1">
                    <div
                        v-for="contributor in contributors"
                        class="col-md-6 d-flex flex-column align-items-start"
                        :key="contributor.name"
                    >
                        <span>
                            {{ contributor.name }}
                        </span>
                        <span class="badge bg-primary">
                            {{ transJoin(contributor.roles) }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="modal-footer d-flex flex-row justify-content-between">
                <div class="d-flex align-items-center">
                    <a
                        href="https://github.com/DH-Center-Tuebingen/Spacialist"
                        target="_blank"
                        class="me-3"
                    >
                        <i class="fab fa-github fa-2x text-dark"></i>
                    </a>
                    <span v-html="t('settings.about.build_info')"></span>
                </div>
                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    data-bs-dismiss="modal"
                    @click="closeModal()"
                >
                    <i class="fas fa-fw fa-times"></i> {{ t('global.close') }}
                </button>
            </div>
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

    import useSystemStore from '@/bootstrap/stores/system.js';

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
            const systemStore = useSystemStore();

            // FUNCTIONS
            const closeModal = _ => {
                context.emit('closing', false);
            }
            const transJoin = roles => {
                return join(roles.map(rn => t(`settings.about.roles.${rn}`)));
            }

            // DATA
            const contributors = getContributors();

            // ON MOUNTED
            onMounted(_ => {
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
                systemStore,
            }
        },
    }
</script>
