import { on, off } from '@/composable/util'

const vClickOutside = {
    mounted(el, binding) {
        function eventHandler(e) {
            if (el.contains(e.target)) {
                return false
            }
            if (binding.value && typeof binding.value === 'function') {
                binding.value(e)
            }
        }
        el.__click_outside__ = eventHandler
        on(document,'click', eventHandler)
    },
    beforeUnmount(el) {
        off(document,'click', el.__click_outside__)
        delete el.__click_outside__
    }
}

export default vClickOutside