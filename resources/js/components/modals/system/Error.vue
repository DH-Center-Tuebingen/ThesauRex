<template>
    <vue-final-modal
        classes="modal-container modal"
        content-class="sp-modal-content sp-modal-content-sm"
        v-model="state.show"
        name="error-modal">
        <div class="modal-header">
            <h5 class="modal-title">
                {{
                    t('global.error.occur')
                }}
            </h5>
            <button type="button" class="btn-close" aria-label="Close" data-bs-dismiss="modal" @click="closeModal()">
            </button>
        </div>
        <div class="modal-body my-3">
            <p v-if="state.hasRequest" v-html="t('global.error.request_failed', {method: data.request.method, url: data.request.url, status: data.request.status})">
            </p>
            <alert
                :message="`<span class='fw-light fst-italic'>${data.msg.error || JSON.stringify(data.msg)}</span>`"
                :type="'error'"
                :noicon="false"
                :icontext="t('global.error.alert_title')" />
            <alert
                :message="t('global.error.info_issue')"
                :type="'info'"
                :noicon="false"
                :icontext="'&nbsp;'" />
            <h6 v-if="data.headers">
                {{ t('global.error.headers') }}
                <span class="clickable" @click="state.showHeaders = !state.showHeaders">
                    <span v-show="state.showHeaders">
                        <i class="fas fa-fw fa-caret-up"></i>
                    </span>
                    <span v-show="!state.showHeaders">
                        <i class="fas fa-fw fa-caret-down"></i>
                    </span>
                </span>
            </h6>
            <dl class="row text-break" v-show="state.showHeaders">
                <template v-for="(header, name) in data.headers" :key="name">
                    <dt class="col-md-3 text-end">
                        {{ name }}
                    </dt>
                    <dd class="col-md-9 font-monospace">
                        {{ header }}
                    </dd>
                </template>
            </dl>
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
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    export default {
        props: {
            data: {
                required: true,
                type: Object,
            },
        },
        emits: ['closing'],
        setup(props, context) {
            const { t } = useI18n();

            const {
                data,
            } = toRefs(props);

            // FUNCTIONS
            const closeModal = _ => {
                state.show = false;
                context.emit('closing', false);
            };

            // DATA
            const state = reactive({
                show: false,
                showHeaders: false,
                hasRequest: computed(_ => Object.keys(data.value.request).length > 0),
            });

            // ON MOUNTED
            onMounted(_ => {
                state.show = true;
            });

            // RETURN
            return {
                t,
                // HELPERS
                // PROPS
                data,
                // LOCAL
                closeModal,
                // STATE
                state,
            }
        },
    }
</script>
