<template>
    <div class="row">
        <div class="col-3 pt-2 border-end">
            <file-upload
                accept="image/*"
                class="w-100"
                ref="upload"
                v-model="state.fileQueue"
                :custom-action="uploadFile"
                :directory="false"
                :drop="true"
                :multiple="false"
                @input-file="inputFile"
            >
                <user-avatar
                    :user="state.avatarUser"
                    class="d-flex justify-content-center"
                ></user-avatar>
            </file-upload>
            <div class="text-center mt-3">
                <button
                    type="button"
                    class="btn btn-outline-danger"
                    :disabled="!state.avatarUser.avatar"
                    @click="deleteAvatar()"
                >
                    {{ t('global.delete') }}
                </button>
            </div>

        </div>
        <div class="col-6 pt-2">
            <div class="d-flex justify-content-between">
                <h3>
                    {{ t('global.user.info_title') }}
                </h3>
                <div>
                    <button
                        type="submit"
                        class="btn btn-outline-success"
                        form="profile-user-info-form"
                    >
                        <i class="fas fa-fw fa-save"></i>
                        {{ t('global.save') }}
                    </button>
                    <button
                        type="button"
                        class="btn btn-outline-warning ms-3"
                        :disabled="!state.isDirty"
                        @click="resetUserInfo()"
                    >
                        <i class="fas fa-fw fa-undo"></i>
                        {{ t('global.reset') }}
                    </button>
                </div>
            </div>
            <form
                id="profile-user-info-form"
                name="profile-user-info-form"
                class="row mt-3"
                role="form"
                @submit.prevent="updateUserInformation()"
            >
                <div class="col-6">
                    <h4>
                        {{ t('global.user.personal_info_title') }}
                    </h4>
                    <div class="mb-2">
                        <label
                            class="fw-bold"
                            for="profile-user-info-name"
                        >
                            {{ t('global.name') }}:
                        </label>
                        <input
                            type="text"
                            class="form-control"
                            id="profile-user-info-name"
                            v-model="state.localUser.name"
                        />
                    </div>
                    <div>
                        <label
                            class="fw-bold"
                            for="profile-user-info-nickname"
                        >
                            {{ t('global.nickname') }}:
                        </label>
                        <input
                            type="text"
                            class="form-control"
                            id="profile-user-info-nickname"
                            v-model="state.localUser.nickname"
                        />
                    </div>
                </div>
                <div class="col-6">
                    <h4>
                        {{ t('global.user.contact') }}
                    </h4>
                    <div class="mb-2">
                        <label
                            class="fw-bold"
                            for="profile-user-contact-email"
                        >
                            <i class="fas fa-fw fa-envelope"></i> {{ t('global.email') }}:
                        </label>
                        <input
                            type="email"
                            class="form-control"
                            id="profile-user-contact-email"
                            v-model="state.localUser.email"
                        />
                    </div>
                    <div class="mb-2">
                        <label
                            class="fw-bold"
                            for="profile-user-contact-phonenumber"
                        >
                            <i class="fas fa-fw fa-mobile-alt"></i> {{ t('global.phonenumber') }}:
                        </label>
                        <input
                            type="tel"
                            class="form-control"
                            id="profile-user-contact-phonenumber"
                            v-model="state.localUser.metadata.phonenumber"
                        />
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script>
    import {
        computed,
        reactive,
        ref,
        watch,
    } from 'vue';

    import { useI18n } from 'vue-i18n';

    import auth from '@/bootstrap/auth.js';

    import {
        getUser,
        cloneDeep,
    } from '@/helpers/helpers.js';

    import {
        setUserAvatar,
        patchUserData,
        deleteUserAvatar,
    } from '@/api.js';

    export default {
        setup(props) {
            const { t } = useI18n();

            // FETCH

            // FUNCTIONS
            const updateUserInformation = _ => {
                let data = {};
                if(state.localUser.name !== '' && state.localUser.name != state.user.name) {
                    data.name = state.localUser.name;
                }
                if(state.localUser.nickname !== '' && state.localUser.nickname != state.user.nickname) {
                    data.nickname = state.localUser.nickname;
                }
                if(state.localUser.email !== '' && state.localUser.email != state.user.email) {
                    data.email = state.localUser.email;
                }
                if(state.localUser.metadata.phonenumber != state.user.metadata.phonenumber) {
                    data.phonenumber = state.localUser.metadata.phonenumber;
                }

                // No changes, no update
                if(Object.keys(data).length === 0) return;

                patchUserData(state.user.id, data).then(data => {
                    updateUserObjects(data);
                });
            };
            const resetUserInfo = _ => {
                state.localUser = appliedMetadata(state.user);
                state.isDirty = false;
            };
            const deleteAvatar = _ => {
                deleteUserAvatar().then(data => {
                    updateUserObjects({
                        avatar: false,
                        avatar_url: '',
                    });
                });
            };
            const updateUserObjects = data => {
                // Workaround to update avatar image, because url may not change
                data.avatar_url += `#${Date.now()}`;
                auth.user({
                    ...getUser(),
                    ...data
                });
                auth.user(
                    appliedMetadata(getUser())
                );
                state.localUser = appliedMetadata(getUser());
                state.avatarUser = appliedMetadata(getUser());
            };
            const uploadFile = (file, component) => {
                return setUserAvatar(file.file).then(data => {
                    updateUserObjects(data)
                });
            };
            const inputFile = (newFile, oldFile) => {

                // Enable automatic upload
                if(!!newFile && (Boolean(newFile) !== Boolean(oldFile) || oldFile.error !== newFile.error)) {
                    if(!newFile.active) {
                        newFile.active = true
                    }
                }
            };
            const appliedMetadata = u => {
                const nu = cloneDeep(u)
                return u.metadata ? nu : { ...nu, ...{ metadata: {} } };
            };

            // DATA
            const state = reactive({
                localUser: appliedMetadata(getUser()),
                avatarUser: appliedMetadata(getUser()),
                fileQueue: [],
                user: computed(_ => appliedMetadata(getUser())),
                isDirty: false,
            });

            // WATCHER
            watch(state.localUser, (newValue, oldValue) => {
                state.isDirty = true;
            });

            // RETURN
            return {
                t,
                inputFile,
                uploadFile,
                deleteAvatar,
                updateUserInformation,
                resetUserInfo,
                state,
            };
        },
    }
</script>
