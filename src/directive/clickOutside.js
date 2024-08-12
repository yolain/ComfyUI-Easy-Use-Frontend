import { on, off } from '@/composable/util'

const vClickOutside = {
    mounted(el, binding) {
        function eventHandler(e) {
            if (el.contains(e.target)) {
                return false
            }
            // 如果绑定的参数是函数，正常情况也应该是函数，执行
            if (binding.value && typeof binding.value === 'function') {
                binding.value(e)
            }
        }
        // 用于销毁前注销事件监听
        el.__click_outside__ = eventHandler
        // 添加事件监听
        on(document,'click', eventHandler)
    },
    beforeUnmount(el) {
        // 移除事件监听
        off(document,'click', el.__click_outside__)
        // 删除无用属性
        delete el.__click_outside__
    }
}

export default vClickOutside