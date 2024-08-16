<template lang="pug">
div(:class="prefix")
  div(:class="prefix+'__header'" @mousedown="e=>$emit('handleHeader',e)")
    .title {{ $t('Nodes Map', true) }}
    .toolbar
      Button(:icon="isExpand ? 'pi pi-angle-double-down' : 'pi pi-angle-double-up'" text rounded severity="secondary" @click.stop="expandAll" size="small" v-tooltip.top="isExpand? $t('Collapse All') : $t('Expand All') " v-if="groups?.length>0")
      slot(name="icon")
  div(:class="prefix+'__content'")
    template(v-if="groups_nodes?.length>0")
      ol
        li(v-for="(item,i) in groups_nodes" :key="i" @dragstart="e=>dragstart(e,i)" @dragend="e=>dragend(e,i)" @dragover="e=>dragover(e,i)" :draggable="true")
          template(v-if="item.children!== undefined")
            Group(:item="item" @changeMode="changeGroupMode(item)" @mousedown="mouseDown(item, 'group')" @mouseup="mouseUp")
              template(v-for="(node,j) in item.children" :key="j")
                Node(:node="node" @changeMode="changeNodeMode(node)" @mousedown="mouseDown(node, 'node')" @mouseup="mouseUp")
          template(v-else)
            Node(:node="item.info" @changeMode="changeNodeMode(item.info)" @mousedown="mouseDown(item.info,'node')" @mouseup="mouseUp")
    .no_result(v-else style="height:100%")
      NoResultsPlaceholder(icon="pi pi-sitemap", :title="$t('No Nodes',true)", :message="$t('No nodes found in the map',true)")
</template>

<script setup>
import Button from "primevue/button";
import vTooltip from 'primevue/tooltip';
import NoResultsPlaceholder from "@/components/common/noResultsPlaceholder.vue";
import Group from "@/components/sidebar/map/group.vue";
import Node from "@/components/sidebar/map/node.vue";
import {app} from "@/composable/comfyAPI";
import {toast} from "@/components/toast";
import { $t } from '@/composable/i18n'
import {ref, watch, defineEmits} from "vue";
import {NODE_MODE} from "@/config/index.js";

const prefix = 'comfyui-easyuse-map-nodes'

import {storeToRefs} from "pinia";
import {useNodesStore} from "@/stores/nodes.js";
import cloneDeep from "lodash/cloneDeep";
import {getSetting} from "@/composable/settings.js";
const store = useNodesStore()
const {groups_nodes, groups} = storeToRefs(store)

// Expand / Collapse
const isExpand = ref(false)
const expandAll = _=>{
  isExpand.value = !isExpand.value
  app.canvas.graph._groups.forEach(group=>{
    group.show_nodes = isExpand.value
  })
  store.setGroups(app.canvas.graph._groups)
}

// Timer
let pressTimer
let firstTime =0, lastTime =0
let isHolding = false
const changeGroupMode = (item, longpress=false) =>{
  if(isHolding){
    isHolding = false
    return
  }
  const is_always = item.children.find(cate=>cate.mode == NODE_MODE.ALWAYS)
  const group_nodes_ids = item.children.map(cate=>cate.id)
  app.canvas.graph._nodes.forEach(node=>{
    if(group_nodes_ids.includes(node.id)){
      node.mode = is_always ? (longpress ? NODE_MODE.NEVER : NODE_MODE.BYPASS) : NODE_MODE.ALWAYS
      node.graph.change()
    }
  })
  store.setNodes(app.canvas.graph._nodes)
}
const changeNodeMode = (item, longpress=false) =>{
  if(isHolding){
    isHolding = false
    return
  }
  const is_always = item.mode == NODE_MODE.ALWAYS
  const node = app.canvas.graph._nodes.find(node=>node.id == item.id)
  if(node){
    node.mode = is_always ? (longpress ? NODE_MODE.NEVER : NODE_MODE.BYPASS) : NODE_MODE.ALWAYS
    node.graph.change()
    store.setNodes(app.canvas.graph._nodes)
  }
}
const mouseDown = (item, type='group') =>{
  firstTime = new Date().getTime();
  clearTimeout(pressTimer);
  pressTimer = setTimeout(_=>{
    type == 'group' ? changeGroupMode(item,true) : changeNodeMode(item,true)
  },500)
}
const mouseUp = _=>{
  lastTime = new Date().getTime();
  if(lastTime - firstTime > 500) isHolding = true
  clearTimeout(pressTimer);
}

// drag
let draggerIndex = ref(null)
let toDragIndex = ref(null)
let isDragging = ref(false)
const dragstart = (e,index)=>{
  draggerIndex.value = index

  e.currentTarget.style.opacity = "0.6";
  e.currentTarget.style.border = "1px dashed yellow";
  e.dataTransfer.effectAllowed = 'move';
}
const dragend = (e,index)=>{
  e.target.style.opacity = "1";
  e.currentTarget.style.border = "1px dashed transparent";
  const nodes_map_sorting = getSetting('EasyUse.NodesMap.Sorting')
  if(nodes_map_sorting !== 'Manual drag&drop sorting'){
    toast.warn($t('For drag and drop sorting, please find Nodes map sorting mode in Settings->EasyUse and change it to manual'))
    return
  }
  let groups = app.canvas.graph._groups
  let dragger_group = groups[draggerIndex.value]
  let todrag_group = groups[toDragIndex.value]
  app.canvas.graph._groups[draggerIndex.value] = todrag_group
  app.canvas.graph._groups[toDragIndex.value] = dragger_group
  store.setGroups(app.canvas.graph._groups)
}

const dragover = (e,index)=>{
  e.preventDefault();
  if (e.currentIndex == draggerIndex.value) return;
  toDragIndex.value = index
}

defineEmits(['handleHeader'])
</script>