import useUserStore from '@/bootstrap/stores/user.js';

export const handleUserLogoutEvent = {
    'UserLogout': data => {
        // Only handle event if from the same user
        console.log('handleUserLogout', data.user_id);
        if(data.user_id == useUserStore().getCurrentUserId) {
            useUserStore().setLoggedOutState();
        }
    },
};