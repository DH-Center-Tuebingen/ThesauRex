<template>
    <modal name="error-modal" height="80%" @before-open="receiveErrorMessage">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Error occured</h5>
                <button type="button" class="close" aria-label="Close" @click="hideErrorModal">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body col d-flex flex-column">
                <p v-if="hasRequest">
                    <code>{{ request.method }}</code> Request <a :href="request.url">{{ request.url }}</a> failed with status <span class="font-weight-bold">{{ request.status }}</span>.
                </p>
                <p class="alert alert-danger col scroll-y-auto">
                    Error Message: <span class="font-weight-light font-italic">{{ msg.error || msg }}</span>
                </p>
                <p class="alert alert-info">
                    If you think this is a bug, please have a look at our <a href="https://github.com/eScienceCenter/Spacialist/issues" target="_blank">issue tracker</a> on github to see if this has been already reported or <a href="https://github.com/eScienceCenter/Spacialist/issues?q=is:issue+is:closed" target="_blank">closed</a> in a later version (Your current version can be found in Settings > About Dialog <i class="fas fa-fw fa-info-circle"></i>). If it is neither reported nor closed, feel free to <a href="https://github.com/eScienceCenter/Spacialist/issues/new" target="_blank">open a new issue</a>.
                </p>
                <h6>
                    Headers
                    <span class="clickable" @click="showHeaders = !showHeaders">
                        <span v-show="showHeaders">
                            <i class="fas fa-fw fa-caret-up"></i>
                        </span>
                        <span v-show="!showHeaders">
                            <i class="fas fa-fw fa-caret-down"></i>
                        </span>
                    </span>
                </h6>
                <dl class="row" v-show="showHeaders">
                    <template v-for="(header, name) in headers">
                        <dt class="col-md-3 text-right">
                            {{ name }}
                        </dt>
                        <dd class="col-md-9">
                            {{ header }}
                        </dd>
                    </template>
                </dl>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary"     @click="hideErrorModal">
                    Close
                </button>
            </div>
        </div>
    </modal>
</template>

<script>
    export default {
        mounted() {},
        methods: {
            receiveErrorMessage(event) {
                this.msg = event.params.msg;
                this.headers = event.params.headers;
                if(event.params.request) {
                    this.request = Object.assign({}, event.params.request);
                } else {
                    this.request = {};
                }
            },
            hideErrorModal() {
                this.$modal.hide('error-modal');
            }
        },
        data() {
            return {
                msg: '',
                headers: '',
                showHeaders: false,
                request: {}
            }
        },
        computed: {
            hasRequest: function() {
                return Object.keys(this.request).length > 0;
            }
        }
    }
</script>
