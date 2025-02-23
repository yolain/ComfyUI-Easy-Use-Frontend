<template lang="pug">
div(:class="prefix" @click="toggle")
  .left.flex-1
    i.icon(v-if="item.children" :class="item.info.show_nodes ? 'pi pi-folder-open' : 'pi pi-folder'" :style="{'color':item.info.color}")
    .edit(v-if="item.info?.is_edit")
      InputText(ref="modifyRef" v-model="title" variant="outline" size="small" type="text" @blur="setGroupTitle" @keydown.enter="setGroupTitle" @keydown.esc="setGroupTitle" style="width:100%")
    .label(v-else)
      span {{item.info.title}}
  .right.toolbar
    template(v-if="item.children?.length>0")
      Button(size="small" :icon="item.children.find(cate=>cate.mode == NODE_MODE.ALWAYS) ? 'pi pi-eye' : 'pi pi-eye-slash'" text rounded severity="secondary" @click.stop="$emit('changeMode')" @mousedown.stop="$emit('mousedown')" @mouseup.stop="$emit('mouseup')")
.child(v-if="item.children?.length>0 && item.info.show_nodes")
  slot
</template>

<script setup>
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import {app} from "@/composable/comfyAPI.js";
import {NODE_MODE} from "@/constants/index.js";

import {ref, defineComponent, defineProps, defineEmits, watch} from 'vue'
defineEmits(['mousedown', 'mouseup','changeMode'])

const prefix = 'comfyui-easyuse-map-nodes-group'
// props
const props = defineProps({
  item: {
    type: Object,
    default: {}
  }
})

// store
import {useNodesStore} from "@/stores/nodes.js";
const store = useNodesStore()

// edit group title
const isModifying = ref(false)
const modifyRef = ref(null)
const title = ref('')

watch(_=> props.item.info.is_edit, value =>{
  if(value) title.value = props.item.info.title
})
const toggle = _=>{
  let item = props.item
  if(item.info?.is_edit) return
  if(item.children?.length>0){
    let group = app.canvas.graph._groups.find(group=>group.pos[0] == item.info.pos[0] && group.pos[1] == item.info.pos[1])
    if(group){
      group.show_nodes = !group.show_nodes
      store.setGroups(app.canvas.graph._groups)
    }
  }
}
const toModify = async() =>{
  if(isModifying.value) return
  let item = props.item
  let group = app.canvas.graph._groups.find(group=>group.pos[0] == item.info.pos[0] && group.pos[1] == item.info.pos[1])
  if(group){
    group.is_edit = !group.is_edit
    title.value = group.is_edit ? item.info.title : ''
    await store.setGroups(app.canvas.graph._groups)
    isModifying.value = true
    modifyRef.value?.[0]?.$el.focus()
  }
}
const setGroupTitle = async()=>{
  let item = props.item
  let group = app.canvas.graph._groups.find(group=>group.pos[0] == item.info.pos[0] && group.pos[1] == item.info.pos[1])
  if(group){
    group.is_edit = false
    group.title = title.value
    await store.setGroups(app.canvas.graph._groups)
    isModifying.value = false
  }else isModifying.value = false
}
</script>