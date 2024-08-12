<template lang="pug">
div(:class="prefix")
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
  onBeforeUnmount,
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
onMounted(_=>{
  updateGroups()
  const graph_div = document.getElementById('graph-canvas')
  const workflows_panel_div = document.getElementsByClassName('comfyui-workflows-panel')?.[0]
  on(graph_div, 'mouseleave', _=>{
    if(timer) destroyTimer()
  })
  on(graph_div, 'mouseenter', _=>{
    if(!timer) addTimer()
  })

  on(workflows_panel_div, 'mouseenter', _=>{
    if(!timer) addTimer()
  })
  on(workflows_panel_div, 'mouseleave', _=>{
    if(timer) destroyTimer()
  })
})

const addTimer = _=> {
  timer = setInterval(_=>{
    console.log(123)
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