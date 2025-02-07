<template lang="pug">
div(:class="prefix")
  nodesMap
</template>

<script setup>
import nodesMap from "@/components/sidebar/map/nodesMap.vue";
import {onMounted} from 'vue'

const prefix = 'comfyui-easyuse-map'

import {useNodesStore} from "@/stores/nodes.js";
const store = useNodesStore()


onMounted(_=>{
  store.watchGraph()
})

</script>