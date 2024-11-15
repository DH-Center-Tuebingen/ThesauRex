import { ref } from 'vue';

/**
 * Assign the focusInputRef to a component to have it focused on mounted.
 * 
 * @returns {Object} focusedInputRef
 */
export default function useForceFocus(delay = 0) {
    const focusedInputRef = ref(null);

    const forceFocus = () => {
        if(focusedInputRef.value) {
            console.log(focusedInputRef.value);
            focusedInputRef.value.focus();
        } else {
            console.log('No focusedInputRef' + focusedInputRef.value);
        }
    }

    return {
        focusedInputRef,
        forceFocus
    }
}