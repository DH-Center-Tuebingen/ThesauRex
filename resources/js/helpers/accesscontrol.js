import {
    fetchAccessGroups,
} from '@/api/accesscontrol.js';

export async function getAccessGroups() {
    return await fetchAccessGroups();
}
