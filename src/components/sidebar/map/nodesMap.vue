<template lang="pug">
div(:class="prefix")
  div(:class="prefix+'__header'" @mousedown="e=>$emit('handleHeader',e)")
    .title {{ $t('NODES MAP') }}
    .toolbar
      Button(:icon="isExpand ? 'pi pi-angle-double-down' : 'pi pi-angle-double-up'" text rounded severity="secondary" @click.stop="expandAll" size="small" v-tooltip.top="isExpand? $t('Collapse All') : $t('Expand All') " v-if="groups?.length>0")
      slot(name="icon")
  div(:class="prefix+'__content'")
    div(:class="prefix+'__content-searchbox'")
      IconField
        InputText.search-box-input(v-model="search" :placeholder="$t('Search by Node ID/Name...')" variant="outlined" style="width:100%")
        InputIcon(v-if="!search" class="pi pi-search")
        InputIcon(v-else class="pi pi-times" @click="search=''")
    template(v-if="search_nodes?.length>0 && search")
      ul
        li(v-for="(item,i) in search_nodes" :key="i")
          Node(
            :node="item"
            @changeMode="changeNodeMode(item)"
            @mousedown="mouseDown(item,'node')"
            @mouseup="mouseUp")
    template(v-else-if="groups_nodes?.length>0 && !search")
      ul
        Tree(v-for="(item,i) in groups_nodes"
          :key="i"
          :item="item"
          :index="i"
          :showGroupOnly="showGroupOnly"
          @dragstart="dragstart"
          @dragend="dragend"
          @dragover="dragover"
          @contextmenu="handleContextMenu"
          @changeGroupMode="changeGroupMode"
          @changeNodeMode="changeNodeMode"
          @mousedown="mouseDown"
          @mouseup="mouseUp")
    .no_result(v-else style="height:100%")
      NoResultsPlaceholder(icon="pi pi-sitemap", :title="$t('No Nodes',true)", :message="search ? $t('No nodes found in the search') : $t('No nodes found in the map',true)")
  ContextMenu(ref="menuRef" :model="menuItems" :autoZIndex="false" appendTo="self")
</template>

<script setup>
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import ContextMenu from "primevue/contextmenu";
import Button from "primevue/button";
import vTooltip from 'primevue/tooltip';
import NoResultsPlaceholder from "@/components/common/noResultsPlaceholder.vue";
import Node from "@/components/sidebar/map/node.vue";
import Tree from './tree.vue';
import {app} from "@/composable/comfyAPI";
import {jumpToNodeId} from "@/composable/node.js";
import {toast} from "@/components/toast";
import { $t } from '@/composable/i18n'
import {ref, watch, defineEmits, computed, onMounted} from "vue";
import {NODE_MODE} from "@/constants/index.js";

const prefix = 'comfyui-easyuse-map-nodes'

import {storeToRefs} from "pinia";
import {useNodesStore} from "@/stores/nodes.js";
import {getSetting} from "@/composable/settings.js";
const store = useNodesStore()
const {groups_nodes, groups, nodes} = storeToRefs(store)

const showGroupOnly = computed(_=> getSetting('EasyUse.NodesMap.DisplayGroupOnly'))

// Expand / Collapse
const isExpand = ref(false)
const expandAll = _=>{
  isExpand.value = !isExpand.value
  app.canvas.graph._groups.forEach(group=>{
    group.show_nodes = isExpand.value
  })
  store.setGroups(app.canvas.graph._groups)
}

// Search
const search = ref('')
const search_nodes = computed(_=>{
  return nodes?.value.filter(node=> node.id?.toString()?.includes(search.value) || node['type']?.includes(search.value) || node['title']?.includes(search.value)) || []
})
// Context Menu
const menuRef = ref(null)
const targetIsNode = ref(false)
const menuItems = computed(() =>
    targetIsNode.value ?
    [
      {
        label: $t('Jump to this node'),
        icon: 'pi pi-arrow-circle-right',
        visible: true,
        command: () => JumpNode(menuTarget.value),
      },
      {
        label: $t('Rename node'),
        icon: 'pi pi-file-edit',
        visible: true,
        command: () => renameNode(menuTarget.value),
      },
      {
        label: $t('Delete node'),
        icon: 'pi pi-trash',
        command: () => deleteNode(menuTarget.value),
        visible: true,
      },
    ]
    :
    [
      {
        label: $t('Rename group'),
        icon: 'pi pi-file-edit',
        visible: true,
        command: () => renameGroup(menuTarget.value),
      },
      {
        label: $t('Delete group'),
        icon: 'pi pi-trash',
        command: () => deleteGroup(menuTarget.value),
        visible: true,
      },
    ]
)
const menuTarget = ref(null)
const handleContextMenu = (event, groupOrNode) => {
  menuTarget.value = groupOrNode
  targetIsNode.value = groupOrNode.children ? false : true
  menuRef.value.show(event)
}
const JumpNode = (node) =>{
  jumpToNodeId(node?.info ? node.info.id : node.id)
}
const renameNode = (node) =>{
  if(node.info) node.info.is_edit = true
  else node.is_edit = true
}
const deleteNode = (node) =>{
  const id = node.info ? node.info.id : node.id
  app.canvas.graph.beforeChange()
  app.canvas.graph._nodes.splice(app.canvas.graph._nodes.findIndex(n=>n.id == id),1)
  app.canvas.graph.afterChange()
  app.canvas.setDirty(true, true)
  store.setNodes(app.canvas.graph._nodes)
}
const renameGroup = (group) =>{
  group.info.is_edit = true
}
const deleteGroup = (group) =>{
  app.canvas.graph.beforeChange()
  app.canvas.graph._groups.splice(app.canvas.graph._groups.findIndex(g=>g.id == group.info.id),1)
  app.canvas.graph.afterChange()
  app.canvas.setDirty(true, true)
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