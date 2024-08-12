<template lang="pug">
div(:class="prefix" ref="mapRef")
  //Splitter(layout="vertical" style="height:100%")
    //SplitterPanel(:size="20")
      div
    //SplitterPanel(:size="80")
  NodesMap
</template>

<script setup>
import Splitter from "primevue/splitter";
import SplitterPanel from "primevue/splitterpanel";
import NodesMap from "@/components/sidebar/map/nodes.vue";
import {app} from "@/composable/comfyAPI.js";
import {on, off} from "@/composable/util.js";
import { $t,locale } from '@/composable/i18n.js'
import {
  ref,
  reactive,
  computed,
  watch,
  defineComponent,
  defineProps,
  defineEmits,
  onMounted,
  onUnmounted,
} from 'vue'
import cloneDeep from "lodash/cloneDeep";

const prefix = 'comfyui-easyuse-map'
defineComponent({name:prefix})

import {storeToRefs} from "pinia";
import {useGroupsStore} from "@/stores/groups.js";
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