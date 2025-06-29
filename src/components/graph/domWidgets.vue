<template>
  <!-- Create a new stacking context for widgets to avoid z-index issues -->
  <div class="isolate">
    <DomWidget
        v-for="widgetState in widgetStates"
        :key="widgetState.widget.id"
        :widget-state="widgetState"
        @update:widget-value="widgetState.widget.value = $event"
    />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

import DomWidget from '@/components/graph/widgets/domWidget.vue'
import { useChainCallback } from '@/composable/utils/useChainCallback.js'
import { useDomWidgetStore } from '@/stores/domWidgetStore.js'
import {useCanvasStore} from "@/stores/canvasStore.js";

const canvasStore = useCanvasStore()
const domWidgetStore = useDomWidgetStore()
const widgetStates = computed(
    () => Array.from(domWidgetStore.widgetStates.values())
)

const updateWidgets = () => {
  const lgCanvas = canvasStore.canvas
  if (!lgCanvas) return

  const lowQuality = lgCanvas.low_quality
  for (const widgetState of domWidgetStore.widgetStates.values()) {
    const widget = widgetState.widget
    const node = widget.node

    const visible =
        lgCanvas.isNodeVisible(node) &&
        !(widget.options.hideOnZoom && lowQuality) &&
        widget.isVisible()

    widgetState.visible = visible
    if (visible) {
      const margin = widget.margin
      widgetState.pos = [node.pos[0] + margin, node.pos[1] + margin + widget.y]
      widgetState.size = [
        (widget.width ?? node.width) - margin * 2,
        (widget.computedHeight ?? 50) - margin * 2
      ]
      // TODO: optimize this logic as it's O(n), where n is the number of nodes
      widgetState.zIndex = lgCanvas.graph?.nodes.indexOf(node) ?? -1
      widgetState.readonly = lgCanvas.read_only
    }
  }
}

watch(
    () => canvasStore.canvas,
    (lgCanvas) => {
      if (!lgCanvas) return

      lgCanvas.onDrawForeground = useChainCallback(
          lgCanvas.onDrawForeground,
          () => {
            updateWidgets()
          }
      )
    },
    { immediate: true }
)
</script>
