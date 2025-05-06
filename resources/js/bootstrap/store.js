import { createPinia } from 'pinia';

export const pinia = createPinia();

export default pinia;

export function useStore() {
    return pinia;
}
