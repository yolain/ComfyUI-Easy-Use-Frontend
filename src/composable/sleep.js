/**
 * Sleep function
 * @param ms
 * @param value
 * @returns {Promise<unknown>}
 */
function sleep(ms = 100, value) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(value);
        }, ms);
    });
}

export default sleep;