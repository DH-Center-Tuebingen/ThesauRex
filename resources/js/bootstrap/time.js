import * as dayjs from 'dayjs';

const relativeTime = require('dayjs/plugin/relativeTime');
const utc = require('dayjs/plugin/utc')
dayjs.extend(relativeTime);
dayjs.extend(utc);

export default dayjs;
