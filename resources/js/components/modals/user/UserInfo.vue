<template>
    <vue-final-modal
        class="modal-container modal"
        name="user-info-modal">
        <div class="sp-modal-content sp-modal-content-xs">
            <div class="modal-header">
                <h5 class="modal-title">
                    {{
                        t('global.user.info_title')
                    }}
                </h5>
                <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
                </button>
            </div>
            <div class="modal-body">
                <div class="text-center">
                    <user-avatar :user="user" :size="128"></user-avatar>
                    <h3 class="mb-0 mt-2">
                        {{ user.name }}
                    </h3>
                    <h6 class="fw-normal text-muted">
                        {{ user.nickname }}
                    </h6>
                    <dl class="row">
                        <dt class="col-md-6">
                            {{ t('global.user.member_since') }}
                        </dt>
                        <dd class="col-md-6">
                            <span id="user-member-since" :title="user.created_at">
                                {{ date(user.created_at, 'DD.MM.YYYY', true, true) }}
                            </span>
                            <br/>
                            <span v-if="state.isDeactivated" class="small text-muted bg-warning rounded px-2 py-1" :title="user.deleted_at" v-html="t('global.user.deactivated_since', {dt: date(user.deleted_at, 'DD.MM.YYYY', true, true)})">
                            </span>
                        </dd>
                        <dt class="col-md-6">
                            {{ t('global.email') }}
                        </dt>
                        <dd class="col-md-6">
                            <a :href="`mailto:${user.email}`">
                                {{ user.email }}
                            </a>
                        </dd>
                        <dt class="col-md-6" v-if="state.hasPhone">
                            {{ t('global.phonenumber') }}
                        </dt>
                        <dd class="col-md-6" v-if="state.hasPhone">
                            <a :href="`tel:${user.metadata.phonenumber}`">
                                {{ user.metadata.phonenumber }}
                            </a>
                        </dd>
                        <dt class="col-md-6" v-if="state.hasOrcid">
                            {{ t('global.orcid') }}
                        </dt>
                        <dd class="col-md-6" v-if="state.hasOrcid">
                            <a :href="`https://orcid.org/${user.metadata.orcid}`" target="_blank">
                                {{ user.metadata.orcid }}
                            </a>
                        </dd>
                    </dl>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" @click="closeModal()">
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
        toRefs,
    } from 'vue';
    import { useI18n } from 'vue-i18n';

    import {
        date,
    } from '@/helpers/filters.js';

    export default {
        props: {
            user: {
                required: true,
                type: Object,
            },
        },
        emits: ['closing'],
        setup(props, context) {
            const { t } = useI18n();
            const {
                user
            } = toRefs(props);

            // FUNCTIONS
            const closeModal = _ => {
                context.emit('closing', false);
            }

            // DATA
            const state = reactive({
                isDeactivated: !!user.value.deleted_at,
                hasMetadata: !!user.value.metadata,
                hasPhone: computed(_ => state.hasMetadata && !!user.value.metadata.phonenumner),
                hasOrcid: computed(_ => state.hasMetadata && !!user.value.metadata.orcid),
            });

            // ON MOUNTED
            onMounted(_ => {
            });

            // RETURN
            return {
                t,
                // HELPERS
                date,
                // PROPS
                user,
                // LOCAL
                closeModal,
                // STATE
                state,
            }
        },
    }
</script>
