import { ref } from 'vue'

/**
 * Finds the intersection between two rectangles
 */
function intersect(a, b) {
    const x1 = Math.max(a.x, b.x)
    const y1 = Math.max(a.y, b.y)
    const x2 = Math.min(a.x + a.width, b.x + b.width)
    const y2 = Math.min(a.y + a.height, b.y + b.height)

    if (x1 >= x2 || y1 >= y2) {
        return null
    }

    return [x1, y1, x2 - x1, y2 - y1]
}

export const useDomClipping = (options = {}) => {
    const style = ref({})
    const { margin = 4 } = options

    /**
     * Calculates a clip path for an element based on its intersection with a selected area
     */
    const calculateClipPath = (
        elementRect,
        canvasRect,
        isSelected,
        selectedArea
    ) => {
        if (!isSelected && selectedArea) {
            const { scale, offset } = selectedArea

            // Get intersection in browser space
            const intersection = intersect(
                {
                    x: elementRect.left - canvasRect.left,
                    y: elementRect.top - canvasRect.top,
                    width: elementRect.width,
                    height: elementRect.height
                },
                {
                    x: (selectedArea.x + offset[0] - margin) * scale,
                    y: (selectedArea.y + offset[1] - margin) * scale,
                    width: (selectedArea.width + 2 * margin) * scale,
                    height: (selectedArea.height + 2 * margin) * scale
                }
            )

            if (!intersection) {
                return ''
            }

            // Convert intersection to canvas scale (element has scale transform)
            const clipX =
                (intersection[0] - elementRect.left + canvasRect.left) / scale + 'px'
            const clipY =
                (intersection[1] - elementRect.top + canvasRect.top) / scale + 'px'
            const clipWidth = intersection[2] / scale + 'px'
            const clipHeight = intersection[3] / scale + 'px'

            return `polygon(0% 0%, 0% 100%, ${clipX} 100%, ${clipX} ${clipY}, calc(${clipX} + ${clipWidth}) ${clipY}, calc(${clipX} + ${clipWidth}) calc(${clipY} + ${clipHeight}), ${clipX} calc(${clipY} + ${clipHeight}), ${clipX} 100%, 100% 100%, 100% 0%)`
        }

        return ''
    }

    /**
     * Updates the clip-path style based on element and selection information
     */
    const updateClipPath = (
        element,
        canvasElement,
        isSelected,
        selectedArea
    ) => {
        const elementRect = element.getBoundingClientRect()
        const canvasRect = canvasElement.getBoundingClientRect()

        const clipPath = calculateClipPath(
            elementRect,
            canvasRect,
            isSelected,
            selectedArea
        )

        style.value = {
            clipPath: clipPath || 'none',
            willChange: 'clip-path'
        }
    }

    return {
        style,
        updateClipPath
    }
}