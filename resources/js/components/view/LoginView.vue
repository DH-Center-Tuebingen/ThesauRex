<template>
    <div class="row d-flex flex-fill justify-content-end">
        <div class="d-flex flex-column flex-fill align-items-center justify-content-center">
            <Login />
            <!-- The spacer grows a maximum of 10rem and shrinks if it gets too small. -->
            <div
                class="spacer"
                style="width: 100%; flex: 1; max-height: 10rem; min-height: 0; overflow: hidden;"
            >
            </div>
        </div>
    </div>
</template>

<script>
    import Login from '@/components/Login.vue';

    export default {
        components: {
            Login,
        },
    }
</script>