/**
 * Stores all DOM widgets that are used in the canvas.
 */
import { defineStore } from 'pinia'
import { markRaw, ref } from 'vue'

export const useDomWidgetStore = defineStore('domWidget', () => {
    const widgetStates = ref(new Map())

    // Register a widget with the store
    const registerWidget = (widget) => {
        widgetStates.value.set(widget.id, {
            widget: markRaw(widget),
            visible: true,
            readonly: false,
            zIndex: 0,
            pos: [0, 0],
            size: [0, 0]
        })
    }

    // Unregister a widget from the store
    const unregisterWidget = (widgetId) => {
        widgetStates.value.delete(widgetId)
    }

    return {
        widgetStates,
        registerWidget,
        unregisterWidget
    }
})