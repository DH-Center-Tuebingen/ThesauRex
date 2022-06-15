<template>
    <span style="display: inline-flex;">
        <img v-if="user.avatar" :src="user.avatar_url" alt="user avatar" :width="size" :height="size" :class="state.styles" class="object-fit-cover" />
        <div v-else :style="state.initialsStyles.container" :class="state.styles" class="d-flex justify-content-center align-items-center">
            <span :style="state.initialsStyles.text">
                {{ state.initials }}
            </span>
        </div>
    </span>
</template>

<script>
    import {
        computed,
        reactive,
        toRefs,
    } from 'vue';

    export default {
        props: {
            user: {
                required: true,
                type: Object
            },
            size: {
                required: false,
                type: Number,
                default: 256
            },
            round: {
                required: false,
                type: Boolean,
                default: true
            }
        },
        setup(props) {
            const { user, size, round } = toRefs(props);
            const state = reactive({
                styles: computed(_ => {
                    return {
                        'rounded-circle': round.value
                    }
                }),
                halfSize: computed(_ => size.value / 2),
                color: computed(_ => {
                    if(!user.value.name) return;
                    let hue = 0;
                    for(let i=0; i < user.value.name.length; i++) {
                        hue = user.value.name.charCodeAt(i) + ((hue << 5) - hue);
                    }

                    hue = hue % 360;
                    return `hsl(${hue}, 32%, 75%)`;
                }),
                initialsStyles: computed(_ => {
                    return {
                        container: {
                            height: `${size.value}px`,
                            width: `${size.value}px`,
                            'background-color': state.color
                        },
                        text: {
                            'font-weight': 'bold',
                            'font-size': `${state.halfSize}px`,
                            'line-height': `${state.halfSize}px`,
                            color: '#ffffff'
                        }
                    }
                }),
                initials: computed(_ => {
                    if(!user.value.name) return;
                    let initials = '';
                    let names = user.value.name.split(' ');
                    initials += names[0].charAt(0).toUpperCase();
                    if(names.length > 1) {
                        initials += names[names.length-1].charAt(0).toUpperCase();
                    }
                    return initials;
                })
            });

            // RETURN
            return {
                state,
                user,
            }
        }
    }
</script>
