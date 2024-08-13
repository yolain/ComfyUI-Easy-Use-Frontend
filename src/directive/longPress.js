import { on, off } from '@/composable/util'

const vLongPress = {
    beforeMount(el, {value:{fn,time}}) {
        if (typeof fn !== 'function') return
        el._timer = null
        el._start = (e) => {
            if (  (e.type === 'mousedown' && e.button && e.button !== 0) ||
                (e.type === 'touchstart' && e.touches && e.touches.length > 1)
            ) return;
            if (el._timer === null) {
                el._timer = setTimeout(() => {
                    fn()
                }, time)
                on(el, 'contextmenu', function(e) {
                    e.preventDefault();
                })
            }
        }
        el._cancel = (e) => {
            if (el._timer !== null) {
                clearTimeout(el._timer)
                el._timer = null
            }
        }
        on(el,'mousedown', el._start);
        on(el,'touchstart', el._start);
        on(el,'click', el._cancel);
        on(el,'mouseout', el._cancel);
        on(el,'touchend', el._cancel);
        on(el,'touchcancel', el._cancel);
    },
    beforeUnmount(el) {
        off(el,'mousedown', el._start);
        off(el,'touchstart', el._start);
        off(el,'click', el._cancel);
        off(el,'mouseout', el._cancel);
        off(el,'touchend', el._cancel);
        off(el,'touchcancel', el._cancel);
    },
};

export default vLongPress;