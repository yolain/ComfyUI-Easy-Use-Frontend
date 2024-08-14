<template lang="pug">
div(:class="prefix")
  div(:class="prefix+'__header'")
    .title {{ $t('Nodes Map', true) }}
    .toolbar
      Button(:icon="isExpand ? 'pi pi-angle-double-down' : 'pi pi-angle-double-up'" text rounded severity="secondary" @click="expandAll" size="small" v-tooltip.right="isExpand? $t('Collapse All') : $t('Expand All') " v-if="groups?.length>0" )
  div(:class="prefix+'__content'")
    template(v-if="groups_nodes?.length>0")
      ol
        li(v-for="(item,i) in groups_nodes" :key="i")
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
import { $t } from '@/composable/i18n'
import {ref, computed, defineComponent, watch, nextTick, onBeforeUnmount, resolveDirective} from "vue";
import {NODE_MODE} from "@/config/index.js";

const prefix = 'comfyui-easyuse-map-nodes'
defineComponent({name:prefix})

import {storeToRefs} from "pinia";
import {useNodesStore} from "@/stores/nodes.js";
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
</script>