/**
 * throttle 函数节流
 * @since 1.0.0
 * @example 适用于限制`resize`和`scroll`等函数的调用频率
 * @param  {Number}    delay          0 或者更大的毫秒数。 对于事件回调，大约100或250毫秒（或更高）的延迟是最有用的。
 * @param  {Boolean}   noTrailing     可选，默认为false。
 *                                    如果noTrailing为true，当节流函数被调用，每过`delay`毫秒`callback`也将执行一次。
 *                                    如果noTrailing为false或者未传入，`callback`将在最后一次调用节流函数后再执行一次.
 *                                    （延迟`delay`毫秒之后，节流函数没有被调用,内部计数器会复位）
 * @param  {Function}  callback       延迟毫秒后执行的函数。`this`上下文和所有参数都是按原样传递的，
 *                                    执行去节流功能时，调用`callback`。
 * @param  {Boolean}   debounceMode   如果`debounceMode`为true，`clear`在`delay`ms后执行。
 *                                    如果debounceMode是false，`callback`在`delay` ms之后执行。
 * @return {Function}  新的节流函数
 */
export function throttle(delay, noTrailing, callback, debounceMode) {

    // After wrapper has stopped being called, this timeout ensures that
    // `callback` is executed at the proper times in `throttle` and `end`
    // debounce modes.
    let timeoutID;

    // Keep track of the last time `callback` was executed.
    let lastExec = 0;

    // `noTrailing` defaults to falsy.
    if (typeof noTrailing !== 'boolean') {
        debounceMode = callback;
        callback = noTrailing;
        noTrailing = undefined;
    }

    // The `wrapper` function encapsulates all of the throttling / debouncing
    // functionality and when executed will limit the rate at which `callback`
    // is executed.
    function wrapper() {

        let self = this;
        let elapsed = Number(new Date()) - lastExec;
        let args = arguments;

        // Execute `callback` and update the `lastExec` timestamp.
        function exec() {
            lastExec = Number(new Date());
            callback.apply(self, args);
        }

        // If `debounceMode` is true (at begin) this is used to clear the flag
        // to allow future `callback` executions.
        function clear() {
            timeoutID = undefined;
        }

        if (debounceMode && !timeoutID) {
            // Since `wrapper` is being called for the first time and
            // `debounceMode` is true (at begin), execute `callback`.
            exec();
        }

        // Clear any existing timeout.
        if (timeoutID) {
            clearTimeout(timeoutID);
        }

        if (debounceMode === undefined && elapsed > delay) {
            // In throttle mode, if `delay` time has been exceeded, execute
            // `callback`.
            exec();

        } else if (noTrailing !== true) {
            // In trailing throttle mode, since `delay` time has not been
            // exceeded, schedule `callback` to execute `delay` ms after most
            // recent execution.
            //
            // If `debounceMode` is true (at begin), schedule `clear` to execute
            // after `delay` ms.
            //
            // If `debounceMode` is false (at end), schedule `callback` to
            // execute after `delay` ms.
            timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
        }

    }

    // Return the wrapper function.
    return wrapper;

}

/**
 * debounce 函数防抖
 * 与throttle不同的是，debounce保证一个函数在多少毫秒内不再被触发，只会执行一次，
 * 要么在第一次调用return的防抖函数时执行，要么在延迟指定毫秒后调用。
 * @since 1.0.0
 * @example 适用场景：如在线编辑的自动存储防抖。
 * @param  {Number}   delay         0或者更大的毫秒数。 对于事件回调，大约100或250毫秒（或更高）的延迟是最有用的。
 * @param  {Boolean}  atBegin       可选，默认为false。
 *                                  如果`atBegin`为false或未传入，回调函数则在第一次调用return的防抖函数后延迟指定毫秒调用。
 *                                  如果`atBegin`为true，回调函数则在第一次调用return的防抖函数时直接执行
 * @param  {Function} callback      延迟毫秒后执行的函数。`this`上下文和所有参数都是按原样传递的，
 *                                  执行去抖动功能时，，调用`callback`。
 * @return {Function} 新的防抖函数。
 */
export function debounce(delay, atBegin, callback) {
    return callback === undefined ? throttle(delay, atBegin, false) : throttle(delay, callback, atBegin !== false);
}

/**
 * formatTime 格式化时间
 * @param time
 * @param format
 * @returns {string|null}
 */
export function formatTime(time, format) {
    time = typeof (time) === "number" ? time : (time instanceof Date ? time.getTime() : parseInt(time));
    if (isNaN(time)) return null;
    if (typeof (format) !== 'string' || !format) format = 'yyyy-MM-dd hh:mm:ss';
    let _time = new Date(time);
    time = _time.toString().split(/[\s\:]/g).slice(0, -2);
    time[1] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'][_time.getMonth()];
    let _mapping = {
        MM: 1,
        dd: 2,
        yyyy: 3,
        hh: 4,
        mm: 5,
        ss: 6
    };
    return format.replace(/([Mmdhs]|y{2})\1/g, (key) => time[_mapping[key]]);
}


/**
 * isLocalNetwork 判断是否是本机或局域网IP
 * @param ip
 * @returns {boolean}
 */
export function isLocalNetwork(ip) {
    const localNetworkRanges = [
        '192.168.',
        '10.',
        '127.',
        /^172\.((1[6-9]|2[0-9]|3[0-1])\.)/
    ];

    return localNetworkRanges.some(range => {
        if (typeof range === 'string') {
            return ip.startsWith(range);
        } else {
            return range.test(ip);
        }
    });
}

export function on(
    element,
    event,
    handler
) {
    if (element && event && handler) {
        return element.addEventListener(event, handler, false);
    }
}
export function off(
    element,
    event,
    handler = _=>{}
) {
    if (element && event) {
        return element.removeEventListener(event, handler, false);
    }
}

export const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
export const normalize = str => isMac ? str.replace(/Ctrl/g, '⌘').replace(/Alt/g, '⌥').replace(/Shift/g, '⇧') : str


/**
 * compareVersion 比较两个版本号
 * @param {string} version1 - 版本号1，格式为 x.x.x
 * @param {string} version2 - 版本号2，格式为 x.x.x
 * @returns {number} - 如果version1 > version2返回1，如果version1 < version2返回-1，相等返回0
 */
export function compareVersion(version1, version2) {
    const v1 = version1.split('.').map(Number);
    const v2 = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
        const num1 = i < v1.length ? v1[i] : 0;
        const num2 = i < v2.length ? v2[i] : 0;

        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }

    return 0;
}