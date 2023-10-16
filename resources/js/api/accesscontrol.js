import {
    default as http,
} from '@/bootstrap/http.js';
import { httpQueue } from '../bootstrap/http';

export async function fetchAccessGroups() {
    return await httpQueue.add(() => http.get(`/access/groups`).then(response => response.data));
}
