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
import {on, off, throttle} from "@/composable/util.js";
import { $t,locale } from '@/composable/i18n.js'
import {ref, reactive, computed, watch, defineComponent, defineProps, defineEmits, onMounted, onUnmounted} from 'vue'
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
  console.log(groups_nodes.value)
}

onMounted(_=>{
  let graphDiv = document.getElementById("graph-canvas")
  updateGroups()
  on(graphDiv,'mousemove', throttle(500,false,_=>{updateGroups()}))
})
onUnmounted(_=>{
  let graphDiv = document.getElementById("graph-canvas")
  off(graphDiv,'mousemove')
})

</script>