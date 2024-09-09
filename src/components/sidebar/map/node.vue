<template lang="pug">
div(:draggable="false" :class="[prefix,{'never':node.mode!==undefined && node.mode==NODE_MODE.NEVER},{'bypass':node.mode!==undefined && node.mode==NODE_MODE.BYPASS}]")
  span.label(@dblclick.stop="jumpToNodeId(node.id)" v-if="node.title !== undefined") {{node.title}}
  span.label.error(v-else) {{node.type}}
  .right.toolbar
    Button(size="small" :icon="node.mode == NODE_MODE.ALWAYS ? 'pi pi-eye' : 'pi pi-eye-slash'" text rounded severity="secondary" @click.stop="$emit('changeMode')" @mousedown.stop="$emit('mousedown')" @mouseup.stop="$emit('mouseup')")
</template>

<script setup>
import Button from "primevue/button";
import {jumpToNodeId} from "@/composable/node.js";
import {NODE_MODE} from "@/config/index.js";

import {defineProps, defineEmits} from 'vue'
defineEmits(['mousedown', 'mouseup','changeMode'])

const prefix = 'comfyui-easyuse-map-nodes-node'

// props
defineProps({
  node: {
    type: Object,
    default: {}
  }
})
</script>