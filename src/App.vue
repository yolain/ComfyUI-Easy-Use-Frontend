<template lang="pug">
CanvasNodes
</template>

<script setup>
import CanvasNodes from "@/components/nodes/index.vue";
import {ref, onMounted, watch, h, render, resolveComponent} from 'vue'

import {app} from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n";

/* Register Extensions*/
import Map from "@/components/sidebar/map/index.vue"
onMounted(_=>{
  // SideBar
  app.extensionManager.registerSidebarTab({
    id: 'easyuse_group_map',
    icon: 'pi pi-sitemap',
    title: $t("Nodes Map"),
    tooltip: $t("Nodes Map"),
    type: "custom",
    render: el=>{
      el.style.height = '100%'
      render(h(Map, {}), el)
    }
  })
})
</script>

<style lang="scss">
@import "@/styles/sass/main.scss";
</style>