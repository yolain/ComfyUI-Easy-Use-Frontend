/**
 * Chain multiple callbacks together.
 *
 * @param originalCallback - The original callback to chain.
 * @param callbacks - The callbacks to chain.
 * @returns A new callback that chains the original callback with the callbacks.
 */
export const useChainCallback = (originalCallback, ...callbacks) => {
    return function(...args) {
        originalCallback?.call(this, ...args);
        callbacks.forEach((callback) => callback.call(this, ...args));
    }
}

/**
 * Replace new callbacks with error handling.
 *
 * @param originalCallback - The fallback callback to call when an error occurs.
 * @param callbacks - The callbacks to chain during normal execution.
 * @returns A new callback that executes callbacks in normal case or originalCallback on error.
 */
export const useTryCatchCallback = (originalCallback, ...callbacks) => {
    return function(...args) {
        try {
            callbacks.forEach((callback) => callback?.call(this, ...args));
        } catch (error) {
            console.warn("[EasyUse hijacking failure, return to originalCallback]", error);
            originalCallback?.call(this, ...args, error);
        }
    }
}