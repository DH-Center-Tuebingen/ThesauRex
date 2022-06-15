export function searchParamsToObject(path) {
    let fullPath = path;
    if(!fullPath.startsWith('http')) {
        let prefix = 'http://localhost';
        if(!fullPath.startsWith('/')) {
            prefix += '/';
        }
        fullPath = `${prefix}${fullPath}`;
    }
    const url = new URL(fullPath);
    const setParams = url.searchParams;
    const params = {};
    setParams.forEach((v, k) => {
        params[k] = v;
    });
    return params;
};
