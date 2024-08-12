import { on, off } from '@/composable/util'

const vLongPress = {
    beforeMount(el, {value:{fn,time}}) {
        //没绑定函数直接返回
        if (typeof fn !== 'function') return
        // 定义定时器变量
        el._timer = null
        // 创建计时器（ n秒后执行函数 ）
        el._start = (e) => {
            //e.type表示触发的事件类型如mousedown,touchstart等
            //pc端: e.button表示是哪个键按下0为鼠标左键，1为中键，2为右键
            //移动端: e.touches表示同时按下的键为个数
            if (  (e.type === 'mousedown' && e.button && e.button !== 0) ||
                (e.type === 'touchstart' && e.touches && e.touches.length > 1)
            ) return;
            //定时长按n秒后执行事件
            if (el._timer === null) {
                el._timer = setTimeout(() => {
                    fn()
                }, time)
                //取消浏览器默认事件，如右键弹窗
                on(el, 'contextmenu', function(e) {
                    e.preventDefault();
                })
            }
        }
        // 如果两秒内松手，则取消计时器
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