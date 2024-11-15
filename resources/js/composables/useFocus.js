import { ref } from 'vue';

/**
 * Assign the focusInputRef to a component to have it focused on mounted.
 * 
 * @returns {Object} focusedInputRef
 */
export default function useFocus(delay) {

    const focusTarget = ref(null);
    const focus = () => {
        console.log('Custom Focus: ', focusTarget.value);
        focusTarget.value.focus();
    }

    return {
        focus,
        focusTarget
    }
}