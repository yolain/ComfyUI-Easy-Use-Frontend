<template lang="pug">
div(:class="prefix" ref="mapRef")
  nodesMap
</template>

<script setup>
import nodesMap from "@/components/sidebar/map/nodesMap.vue";
import {app} from "@/composable/comfyAPI.js";
import {ref, defineComponent, onMounted, onUnmounted,} from 'vue'

const prefix = 'comfyui-easyuse-map'
defineComponent({name:prefix})

import {storeToRefs} from "pinia";
import {useGroupsStore} from "@/stores/nodes.js";
const store = useGroupsStore()
const {groups_nodes} = storeToRefs(store)

const updateGroups = async () => {
  let groups = app.canvas.graph._groups
  let nodes = app.canvas.graph._nodes
  await store.setGroups(groups)
  await store.setNodes(nodes)
  // console.log(groups_nodes.value)
}

let timer = null
const mapRef = ref(null)
onMounted(_=>{
  updateGroups()
  if(!timer) addTimer()
})
onUnmounted(_=>{
  destroyTimer()
})

const addTimer = _=> {
  timer = setInterval(_=>{
    const active_bar = app.extensionManager.activeSidebarTab
    if(active_bar == 'easyuse_nodes_map') updateGroups()
    else destroyTimer()
  },500)
}
const destroyTimer = _=> {
  clearInterval(timer)
  timer = null
}

</script>