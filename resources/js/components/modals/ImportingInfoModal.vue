<template>
    <modal
        name="importing-info-modal"
        :click-to-close="false"
    >
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">
                    {{
                        $t('modals.import_info.title')
                    }}
                </h5>
            </div>
            <div class="modal-body col">
                <LoadingSpinner />
                {{ $t('modals.import_info.info') }}
            </div>
            <div class="modal-footer d-flex justify-content-between">
            </div>
        </div>
    </modal>
</template>

<script>
    import LoadingSpinner from '../LoadingSpinner.vue';

    export default {
        components: {
            LoadingSpinner,
        },
        name: 'ImportingInfo',
    }
</script>
