<template lang="pug">
div(:class="prefix")
  nodesMap
</template>

<script setup>
import nodesMap from "@/components/sidebar/map/nodesMap.vue";
import {app} from "@/composable/comfyAPI.js";
import {ref, defineComponent, onMounted, onUnmounted,} from 'vue'

const prefix = 'comfyui-easyuse-map'
defineComponent({name:prefix})

import {useNodesStore} from "@/stores/nodes.js";
const store = useNodesStore()

onMounted(_=>{
  store.watchGraph()
})
onUnmounted(_=>{
  // onUnmounted does not work when the render function renders it to the sidebar
})

</script>