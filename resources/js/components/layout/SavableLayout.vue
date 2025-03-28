<template>
    <div class="h-100 d-flex flex-column p-4">
        <header class="mb-3">
            <h3 class="d-flex flex-row gap-2 align-items-center justify-content-between">
                {{ title }}
                <slot name="actions"></slot>
                <template v-if="!$slots.actions">
                    <button
                        type="button"
                        class="btn btn-outline-success btn-sm"
                        @click="save()"
                    >
                        <i class="fas fa-fw fa-save"></i>
                        {{ t('global.save') }}
                    </button>
                </template>

            </h3>
        </header>
        <div class="layout-content">
            <slot></slot>
        </div>
    </div>
</template>

<script>
    import {useI18n} from 'vue-i18n';

    export default {
        props: {
            title: {
                type: String,
                required: true,
            },
            disabled: {
                type: Boolean,
                default: false,
            },
        },
        setup(props, {emit}) {
            const {t} = useI18n();


            function save() {
                // Logic to save preferences
                emit('save');
            }

            return {
                t,
                save,
            };
        }
    }
</script>