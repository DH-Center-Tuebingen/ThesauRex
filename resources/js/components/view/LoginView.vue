<template>
    <div class="background login-background">
        <img
            src="/storage/wallpaper_kilcrea.jpg"
            alt=""
            style="display: block; object-fit: cover; max-width: 100%; max-height: 100%; height:100%; width: 100%; position: fixed;left: 0;top: 0;z-index: -1; transform: scaleX(-1);"
        >
    </div>
    <div class="row d-flex flex-fill justify-content-end">
        <div
            class="h-100 d-flex flex-column col-12 col-lg-8 col-xl-7 col-xxl-5"
            style="background-color: rgba(255,255,255,0.2); backdrop-filter: blur(5px);"
        >
            <div class="d-flex flex-column flex-fill align-items-center justify-content-center">
                <Login/>
                <!-- The spacer grows a maximum of 10rem and shrinks if it gets too small. -->
                <div class="spacer"
                    style="width: 100%; flex: 1; max-height: 10rem; min-height: 0; overflow: hidden;"
                >   
                </div>
            </div>
            <footer>
                <span
                    class="attribution image-attribution text-white d-block text-end"
                    data-source="https://de.wikipedia.org/wiki/Datei:KilcreaFriary.JPG"
                    data-accecss-date="2025-03-12"
                >IMAEG © John Armagh 2009 - Public Domain</span>
            </footer>
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