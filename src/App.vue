<template lang="pug">
graphNodes
</template>

<script setup>
import graphNodes from "@/components/graph/index.vue";
import {ref, onMounted, onUnmounted, watch, h, render } from 'vue'

import {api, app} from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n";
import {NODES_MAP_ID} from "@/config/index";

/* Register Extensions*/
import Map from "@/components/sidebar/map/index.vue"
// import Queue from "@/components/sidebar/queue/index.vue"
// import { useQueuePendingTaskCountStore } from '@/stores/queue'

// const queuePendingTaskCountStore = useQueuePendingTaskCountStore()
// const onStatus = (e) => queuePendingTaskCountStore.update(e)
const init = _=>{
  // SideBar
  // app.extensionManager.unregisterSidebarTab('queue')
  // app.extensionManager.registerSidebarTab({
  //   id: 'easyuse_queue',
  //   icon: 'pi pi-history',
  //   iconBadge: () => {
  //     const value = useQueuePendingTaskCountStore().count.toString()
  //     console.log(value)
  //     return value === '0' ? null : value
  //   },
  //   title: $t("Queue", true),
  //   tooltip: $t("Queue", true),
  //   type: 'custom',
  //   render: el => {
  //     el.style.height = '100%'
  //     render(h(Queue,{}),el)
  //   }
  // })
  app.extensionManager.registerSidebarTab({
    id: NODES_MAP_ID,
    icon: 'pi pi-sitemap',
    title: $t("Nodes Map", true),
    tooltip: $t("Nodes Map", true),
    type: 'custom',
    render: el => {
      el.style.height = '100%'
      render(h(Map,{}),el)
    }
  })
}
onMounted(_=>{
  try {
    // api.addEventListener('status', onStatus)
    init()
  } catch (e) {
    console.error('Failed to init Easy Use App', e)
  }
})
// onUnmounted(() => {api.removeEventListener('status', onStatus)})
</script>

<style lang="scss">
@import "@/styles/sass/main.scss";
@import "@/styles/css/index.css";
</style>