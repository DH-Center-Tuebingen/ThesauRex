import dayjs from '@/bootstrap/time.js';
import {
    isArray,
} from '@/helpers/helpers.js';

export function date(value, format = 'DD.MM.YYYY HH:mm', useLocale = false) {
    if(value) {
        let d;
        if(isNaN(value)) {
            d = dayjs.utc(value);
        } else {
            d = dayjs.utc(value*1000);
        }
        return d.format(format);
    }
}
export function datestring(value) {
    if(value) {
        const d = isNaN(value) ? dayjs.utc(value) : dayjs.utc(value*1000);
        return d.toDate().toString();
    }
}
export function join(arr, separator = ', ') {
    if(!arr && !isArray(arr)) return arr;

    return arr.join(separator);
}
