<template>
    <div class="row">
        <label class="col-md-2 form-label"></label>
        <div class="col-md-10">
            <div class="form-check form-switch">
                <input
                    class="form-check-input"
                    type="checkbox"
                    v-model="state.enabled"
                    :readonly="readonly"
                    :disabled="readonly"
                    @input="onChange"
                >
            </div>
        </div>
        <div
            v-if="state.enabled"
            class="row mt-3"
        >
            <div class="col-md-10 offset-md-2">
                <div
                    class="alert bg-info mb-0 w-50"
                    v-html="t('settings.preference.info.password_reset_link')"
                ></div>
            </div>
        </div>
    </div>
</template>

<script>
    import {
        reactive,
        toRefs,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import {
        debounce
    } from '@/helpers/helpers.js';

    export default {
        props: {
            data: {
                required: true,
                type: Boolean,
            },
            readonly: {
                required: false,
                type: Boolean,
                default: false,
            },
        },
        emits: ['changed'],
        setup(props, context) {
            const { t } = useI18n();
            const {
                readonly,
                data,
            } = toRefs(props);

            // FUNCTIONS
            const onChange = debounce(e => {
                if(readonly.value) return;
                context.emit('changed', {
                    value: e.target.checked
                });
            }, 250);

            // DATA
            const state = reactive({
                enabled: data.value,
            });

            // RETURN
            return {
                t,
                // LOCAL
                onChange,
                // PROPS
                readonly,
                // STATE
                state,
            };
        }
    }
</script>
