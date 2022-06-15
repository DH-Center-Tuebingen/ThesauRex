<template>
    <div class="alert" :class="state.classes" role="alert">
        <div v-if="state.hasIcon" :class="state.iconWrapperClasses">
            <i class="fas" :class="state.iconClasses"></i>
            <span class="fw-medium">
                {{ icontext }}
            </span>
        </div>
        <div v-html="message"></div>
    </div>
</template>

<script>
    import {
        computed,
        reactive,
        toRefs,
    } from 'vue';

    export default {
        props: {
            message: {
                required: true,
                type: String,
            },
            type: {
                required: false,
                type: String,
                default: '',
            },
            noicon: {
                required: false,
                type: Boolean,
                default: true,
            },
            icontext: {
                required: false,
                type: String,
            }
        },
        setup(props, context) {
            const {
                message,
                type,
                noicon,
                icontext,
            } = toRefs(props);

            // FUNCTIONS

            // DATA
            const state = reactive({
                hasIcon: computed(_ => {
                    return !noicon.value && state.supportsIcon;
                }),
                hasIconText: computed(_ => {
                    return state.hasIcon && (!!icontext && !!icontext.value);
                }),
                supportsIcon: computed(_ => {
                    switch(type.value) {
                        case 'success':
                        case 'note':
                        case 'info':
                        case 'warning':
                        case 'error':
                            return true;
                        case 'mono':
                        default:
                            return false;
                    }
                }),
                classes: computed(_ => {
                    let classes = [];
                    switch(type.value) {
                        case 'success':
                            classes.push('alert-success');
                            break;
                        case 'note':
                        case 'info':
                            classes.push('alert-info');
                            break;
                        case 'warning':
                            classes.push('alert-warning');
                            break;
                        case 'error':
                            classes.push('alert-danger');
                            break;
                        case 'mono':
                            classes.push('alert-secondary');
                            break;
                        default:
                            classes.push('alert-primary');
                            break;
                    }
                    
                    if(state.hasIcon) {
                        classes.push('d-flex');
                        if(state.hasIconText) {
                            classes.push('flex-column');
                        } else {
                            classes.push('flex-row');
                        }
                    }

                    return classes;
                }),
                iconClasses: computed(_ => {
                    let classes = [];
                    if(!state.hasIcon) return classes;
                    switch(type.value) {
                        case 'success':
                            classes.push('fa-check');
                            break;
                        case 'note':
                            classes.push('fa-lightbulb');
                            break;
                        case 'info':
                            classes.push('fa-info-circle');
                            break;
                        case 'warning':
                            classes.push('fa-exclamation-triangle');
                            break;
                        case 'error':
                            classes.push('fa-times');
                            break;
                    }
                    if(state.hasIconText) {
                        classes.push('me-2');
                    }
                    return classes;
                }),
                iconWrapperClasses: computed(_ => {
                    let classes = [];
                    if(!state.hasIcon) return classes;
                    if(!state.hasIconText) {
                        classes.push('me-2');
                    }
                    return classes;
                }),
            });

            // RETURN
            return {
                // HELPERS
                // PROPS
                message,
                icontext,
                // LOCAL
                // STATE
                state,
            }
        },
    }
</script>