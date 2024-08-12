<template lang="pug">
div(:class="prefix")
  div(:class="prefix+'__header'")
    .title {{ $t('Nodes Map', true) }}
    .toolbar
      Button(:icon="isExpand ? 'pi pi-angle-double-down' : 'pi pi-angle-double-up'" text rounded severity="secondary" @click="expandAll" size="small" v-tooltip.right="isExpand? $t('Collapse All') : $t('Expand All') " v-if="groups?.length>0" )
  div(:class="prefix+'__content'")
    template(v-if="groups_nodes?.length>0")
      ol
        li.item(v-for="(item,i) in groups_nodes" :key="i")
          .title-bar(@click="clickItem(item)" :class="[{'never':item.info?.mode!==undefined && item.info.mode==2},{'bypass':item.info?.mode!==undefined && item.info.mode==4}]")
            .left.flex-1
              i.icon(v-if="item.children" :class="item.info.show_child ? 'pi pi-folder-open' : 'pi pi-folder'" :style="{'color':item.info.color}")
              .edit(v-if="item.info.is_edit")
                InputText(ref="editRef" v-model="title" variant="outlined" size="small" type="text" @blur="editGroupTitle(item)" @keydown.enter="editGroupTitle(item)" @keydown.esc="editGroupTitle(item)" style="width:100%")
              .node(v-else-if="item.info.id" :class="[{'never':item.info.mode!==undefined && item.info.mode==NODE_MODE.NEVER},{'bypass':item.info.mode!==undefined && item.info.mode==NODE_MODE.BYPASS}]")
                span.node-label(@dblclick.stop="jumpToNodeId(item.info.id)" v-if="item.info.title!==undefined") {{item.info.title}}
                span.node-label.error(v-else) {{item.info.type}}
              .label(v-else)
                span(@dblclick.stop="toEdit(item)") {{item.info.title}}
            .right.toolbar
              template(v-if="item.children?.length>0")
                Button(size="small" :icon="item.children.find(cate=>cate.mode == NODE_MODE.ALWAYS) ? 'pi pi-eye' : 'pi pi-eye-slash'" text rounded severity="secondary" @click.stop="changeGroupMode(item)" @mousedown.stop="mouseDown(item, 'group')" @mouseup.stop="mouseUp")
              template(v-else)
                Button(size="small" :icon="item.info?.mode == NODE_MODE.ALWAYS ? 'pi pi-eye' : 'pi pi-eye-slash'" text rounded severity="secondary" @click.stop="changeNodeMode(item.info)" @mousedown.stop="mouseDown(item.info, 'node')" @mouseup.stop="mouseUp")
          dl.nodes(v-if="item.children?.length>0 && item.info.show_child")
            dt.node(v-for="(node,j) in item.children" :key="j" :class="[{'never':node?.mode!==undefined && node.mode==NODE_MODE.NEVER},{'bypass':node?.mode!==undefined && node.mode==NODE_MODE.BYPASS}]")
              span.node-label(@dblclick.stop="jumpToNodeId(node.id)" v-if="node.title !== undefined") {{node.title}}
              span.node-label.error(v-else) {{node.type}}
              .right.toolbar
                Button(size="small" :icon="node.mode == NODE_MODE.ALWAYS ? 'pi pi-eye' : 'pi pi-eye-slash'" text rounded severity="secondary" @click.stop="changeNodeMode(node)" @mousedown.stop="mouseDown(node, 'node')" @mouseup.stop="mouseUp")
    .no_result(v-else style="height:100%")
      NoResultsPlaceholder(icon="pi pi-sitemap", :title="$t('No Nodes',true)", :message="$t('No nodes found in the map',true)")
</template>

<script setup>
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import vTooltip from 'primevue/tooltip';
import NoResultsPlaceholder from "@/components/common/noResultsPlaceholder.vue";
import {app} from "@/composable/comfyAPI";
import { $t } from '@/composable/i18n'
import {jumpToNode, jumpToNodeId} from "@/composable/node.js";
import {ref, computed, defineComponent, watch, nextTick, onBeforeUnmount, resolveDirective} from "vue";
import {NODE_MODE} from "@/config/index.js";

const prefix = 'comfyui-easyuse-map-nodes'
defineComponent({name:prefix})

import {storeToRefs} from "pinia";
import {useGroupsStore} from "@/stores/groups.js";
const store = useGroupsStore()
const {groups_nodes, groups} = storeToRefs(store)

const clickItem = item =>{
  if(item.info?.is_edit) return
  if(item.children?.length>0){
    let group = app.canvas.graph._groups.find(group=>group.pos[0] == item.info.pos[0] && group.pos[1] == item.info.pos[1])
    if(group){
      group.show_child = !group.show_child
      store.setGroups(app.canvas.graph._groups)
    }
  }
}
const isExpand = ref(false)
const expandAll = _=>{
  isExpand.value = !isExpand.value
  app.canvas.graph._groups.forEach(group=>{
    group.show_child = isExpand.value
  })
  store.setGroups(app.canvas.graph._groups)
}

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


// edit group title
const isEditing = ref(false)
const editRef = ref(null)
const title = ref('')
const toEdit = async(item) =>{
  if(isEditing.value) return
  let group = app.canvas.graph._groups.find(group=>group.pos[0] == item.info.pos[0] && group.pos[1] == item.info.pos[1])
  if(group){
    group.is_edit = !group.is_edit
    title.value = group.is_edit ? item.info.title : ''
    await store.setGroups(app.canvas.graph._groups)
    isEditing.value = true
    editRef.value?.[0]?.$el.focus()
  }
}
const editGroupTitle = async(item)=>{
  let group = app.canvas.graph._groups.find(group=>group.pos[0] == item.info.pos[0] && group.pos[1] == item.info.pos[1])
  if(group){
    group.is_edit = false
    group.title = title.value
    await store.setGroups(app.canvas.graph._groups)
    isEditing.value = false
  }else isEditing.value = false
}
</script>