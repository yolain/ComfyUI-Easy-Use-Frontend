import { computed, ref } from 'vue'
import {app} from "@/composable/comfyAPI.js";
import { useCanvasPositionConversion } from './useCanvasPositionConversion.js'

import {useCanvasStore} from "@/stores/canvasStore.js";

/**
 * 使用绝对定位组件的可组合函数
 * @param {Object} options - 配置选项
 * @param {boolean} [options.useTransform=false] - 是否使用 transform 缩放
 * @returns {Object} 包含样式和更新位置方法的对象
 */
export function useAbsolutePosition(options = {}) {
    const { useTransform = false } = options

    const canvasStore = useCanvasStore()
    const lgCanvas = canvasStore.getCanvas()
    const { canvasPosToClientPos } = useCanvasPositionConversion(
        lgCanvas.canvas,
        lgCanvas
    )

    const position = ref({
        pos: [0, 0],
        size: [0, 0]
    })

    const style = computed(() => {
        const { pos, size, scale = lgCanvas.ds.scale } = position.value
        const [left, top] = canvasPosToClientPos(pos)
        const [width, height] = size

        return useTransform
            ? {
                position: 'fixed',
                transformOrigin: '0 0',
                transform: `scale(${scale})`,
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`
            }
            : {
                position: 'fixed',
                left: `${left}px`,
                top: `${top}px`,
                width: `${width * scale}px`,
                height: `${height * scale}px`
            }
    })

    /**
     * 更新元素在画布上的位置
     *
     * @param {Object} config - 位置配置对象
     * @param {Array<number>} config.pos - 元素在画布上的位置 [x, y]
     * @param {Array<number>} config.size - 元素在画布上的大小 [width, height]
     * @param {number} [config.scale] - 画布的缩放因子
     */
    const updatePosition = (config) => {
        position.value = config
    }

    return {
        style,
        updatePosition
    }
}