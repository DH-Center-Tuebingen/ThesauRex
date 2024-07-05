<template>
    <div ref="contextMenuRef" class="context-menu" :style="contextPositioning">
        <div class="red">

        </div>
        <component :is="component"></component>
    </div>
</template>

<script>
import { onBeforeUnmount } from 'vue';
import { ref } from 'vue';
import { onMounted } from 'vue';
import store from '../bootstrap/store';

export default {
    props: {
        component: {
            type: String,
            required: true,
        }
    },
    setup() {
        const contextMenuRef = ref(null);

        const handleClickOutside = (e) => {
            if (contextMenuRef.value && !contextMenuRef.value.contains(e.target)) {
                // Click was outside the context menu, perform your action here
                store.commit('contextMenu/setActive', false);
            }
        };

        onMounted(() => {
            document.body.addEventListener('click', handleClickOutside);
        });

        onBeforeUnmount(() => {
            document.body.removeEventListener('click', handleClickOutside);
        });

        return {
            contextMenuRef,
            contextPositioning: {
                position: 'absolute',
                top: '0px',
                left: '0px',
                zIndex: 1000,
            }
        }
    }

};
</script>

<style lang='scss' scoped>
.red {
    background-color: red;
    width: 100px;
    height: 100px;
}
</style>