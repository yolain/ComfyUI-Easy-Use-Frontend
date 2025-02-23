<template lang="pug">
div(:draggable="false" :class="[prefix,{'never':node.mode!==undefined && node.mode==NODE_MODE.NEVER},{'bypass':node.mode!==undefined && node.mode==NODE_MODE.BYPASS}]")
  .left.flex-1
    span.node_id(v-if="showNodeID") {{node.id}}
    .edit(v-if="node?.is_edit")
      InputText(ref="modifyRef" v-model="title" variant="outline" size="small" type="text" @blur="setNodeTitle" @keydown.enter="setNodeTitle" @keydown.esc="setNodeTitle" style="width:100%")
    span.label(@dblclick.stop="jumpToNodeId(node.id)" v-else-if="node.title !== undefined") {{node.title}}
    span.label.error(v-else @dblclick.stop="jumpToNodeId(node.id)") {{node.type}}
  .right.toolbar
    Button(size="small" :icon="node.mode == NODE_MODE.ALWAYS ? 'pi pi-eye' : 'pi pi-eye-slash'" text rounded severity="secondary" @click.stop="$emit('changeMode')" @mousedown.stop="$emit('mousedown')" @mouseup.stop="$emit('mouseup')")
</template>

<script setup>
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import {jumpToNodeId} from "@/composable/node.js";
import {NODE_MODE} from "@/constants/index.js";

import {defineProps, defineEmits, computed, watch, ref} from 'vue'
import {getSetting} from "@/composable/settings.js";
import {app} from "@/composable/comfyAPI.js";
defineEmits(['mousedown', 'mouseup','changeMode'])

// store
import {useNodesStore} from "@/stores/nodes.js";
const store = useNodesStore()

const showNodeID = computed(_=> getSetting('EasyUse.NodesMap.DisplayNodeID'))
const prefix = 'comfyui-easyuse-map-nodes-node'

// props
const props = defineProps({
  node: {
    type: Object,
    default: {}
  }
})

// edit group title
const isModifying = ref(false)
const modifyRef = ref(null)
const title = ref('')

watch(_=> props.node.is_edit, value =>{
  if(value) title.value = props.node.title
})


const setNodeTitle = async()=>{
  let _node = app.canvas.graph._nodes.find(node=>node.id == props.node.id)
  if(_node){
    _node.is_edit = false
    _node.title = title.value
    await store.setNodes(app.canvas.graph._nodes)
    isModifying.value = false
  }else isModifying.value = false
}
</script>