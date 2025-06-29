import { useElementBounding } from '@vueuse/core'

/**
 * Convert between canvas and client positions
 * @param canvasElement - The canvas element
 * @param lgCanvas - The litegraph canvas
 * @returns The canvas position conversion functions
 */
export const useCanvasPositionConversion = (
    canvasElement,
    lgCanvas
) => {
    const { left, top } = useElementBounding(canvasElement)

    const clientPosToCanvasPos = (pos) => {
        const { offset, scale } = lgCanvas.ds
        return [
            (pos[0] - left.value) / scale - offset[0],
            (pos[1] - top.value) / scale - offset[1]
        ]
    }

    const canvasPosToClientPos = (pos) => {
        const { offset, scale } = lgCanvas.ds
        return [
            (pos[0] + offset[0]) * scale + left.value,
            (pos[1] + offset[1]) * scale + top.value
        ]
    }

    return {
        clientPosToCanvasPos,
        canvasPosToClientPos
    }
}