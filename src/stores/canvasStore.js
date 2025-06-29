import { defineStore } from 'pinia'
import { markRaw, ref, shallowRef, computed } from 'vue'
import {app} from "@/composable/comfyAPI.js";

export const useCanvasStore = defineStore('fastCanvas', () => {
    /**
     * The LGraphCanvas instance.
     *
     * The root LGraphCanvas object is shallow reactive.
     */
    const canvas = shallowRef( null)
    /**
     * The selected items on the canvas. All stored items are raw.
     */
    const selectedItems = ref([])
    const updateSelectedItems = () => {
        const items = Array.from(canvas.value?.selectedItems ?? [])
        selectedItems.value = items.map((item) => markRaw(item))
    }

    const getCanvas = () => {
        if (!canvas.value) {
            canvas.value = app.canvas
            canvas.value.render_canvas_border = false
            // throw new Error('getCanvas: canvas is null')
        }
        return canvas.value
    }

    return {
        canvas,
        selectedItems,
        updateSelectedItems,
        getCanvas,
    }
})
