export default {
    namespaced: true,
    state: {
        active: false,
        component: null,
    },
    mutations: {
        setComponent(state, component) {
            state.component = component;
        },
        setActive(state, active) {
            state.active = active;
        },

        set(state, { target, component }) {
            state.active = true;
            state.component = component;
        },
    },
    actions: {
        toggleActive({ commit, state }) {
            commit('setActive', !state.active);
        },
    },
    getters: {
        component: state => state.component,
        active: state => state.active,
    },
}