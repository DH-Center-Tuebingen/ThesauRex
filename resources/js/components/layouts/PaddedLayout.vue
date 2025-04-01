<template>
    <div class="p-3">
        <component :is="component"/>
    </div>
</template>

<script>

export default {
    props: {
        component: {
            type: String,
            required: true
        }
    }
};

</script>