<template>
    <div :id="state.id" class="toast" :class="state.toastClasses" role="alert" aria-live="assertive" aria-atomic="true" :data-bs-autohide="state.autohide" :data-bs-delay="state.duration">
        <div class="toast-header" v-if="!state.simple">
            <span v-if="state.icon" class="badge rounded-pill me-2" :class="state.badgeClass">
                <i class="fas fa-fw" :class="state.iconClass"></i>
            </span>
            <strong class="me-auto">
                {{ state.title }}
            </strong>
            <!-- <small class="text-muted">just now</small> -->
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body" v-if="state.htmlContent" v-html="state.message"/>
        <div class="toast-body" v-else>
            {{ state.message }}
        </div>
        <button v-if="state.simplePersist" type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
</template>

<script>
    import {
        computed,
        reactive,
        toRefs,
    } from 'vue';

    import {
        getTs
    } from '@/helpers/helpers.js';

    export default {
        props: {
            id: {
                type: String,
                required: false,
            },
            icon: {
                type: Boolean,
                required: false,
                default: false,
            },
            simple: {
                type: Boolean,
                required: false,
                default: false,
            },
            message: {
                type: String,
                required: true,
            },
            title: {
                type: String,
                required: true,
            },
            duration: {
                type: Number,
                required: true,
            },
            autohide: {
                type: Boolean,
                required: true,
            },
            channel: {
                type: String,
                required: false,
            },
            html: {
                type: Boolean,
                required: false
            },
        },
        setup(props, context) {
            const {
                id,
                icon,
                simple,
                message,
                title,
                duration,
                autohide,
                channel,
                html,
            } = toRefs(props);

            // DATA
            const state = reactive({
                id: id || `toast-${getTs()}`,
                message: message,
                title: title,
                duration: duration,
                simple: simple,
                autohide: autohide,
                htmlContent: html,
                simplePersist: computed(_ => simple.value && !autohide.value),
                icon: computed(_ => state.iconClass.length > 0),
                iconClass: computed(_ => {
                    if(!icon.value) return [];

                    switch(channel.value) {
                        case 'success':
                            return ['fa-check'];
                        case 'info':
                            return ['fa-info-circle'];
                        case 'warning':
                            return ['fa-exclamation-triangle'];
                        case 'danger':
                            return ['fa-times'];
                        default:
                            return [];
                    }
                }),
                badgeClass: computed(_ => {
                    if(!icon.value) return [];

                    return `bg-${channel.value}`;
                }),
                toastClasses: computed(_ => {
                    let classes = ['border-0'];
                    switch(channel.value) {
                        case 'success':
                            classes.push(['bg-success', 'text-white']);
                            break;
                        case 'info':
                            classes.push(['bg-info', 'text-dark']);
                            break;
                        case 'warning':
                            classes.push(['bg-warning', 'text-dark']);
                            break;
                        case 'danger':
                            classes.push(['bg-danger', 'text-white']);
                            break;
                        case 'primary':
                            classes.push(['bg-primary', 'text-white']);
                            break;
                        case 'secondary':
                            classes.push(['bg-secondary', 'text-white']);
                            break;
                        case 'dark':
                            classes.push(['bg-dark', 'text-white']);
                            break;
                        default:
                            // use default bootstrap styling for unsupported/non-existing channel
                            classes = [];
                    }
                    if(state.simplePersist) {
                        classes.push(['d-flex align-items-center']);
                    }
                    return classes;
                }),
            });

            // RETURN
            return {
                // STATE
                state,
            }
        }
    }
</script>
