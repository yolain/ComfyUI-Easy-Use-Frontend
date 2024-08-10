<template lang="pug">
CanvasNodes
</template>

<script setup>
import CanvasNodes from "@/components/nodes/index.vue";
import {ref, onMounted, watch, h, render} from 'vue'

import {app} from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n";

/* Register Extensions*/
onMounted(_=>{
  // SideBar
  // app.extensionManager.registerSidebarTab({
  //   id: 'easyuse_map',
  //   icon: 'pi pi-map',
  //   title: $t("EasyUse Map"),
  //   tooltip: "EasyUse Map",
  //   type: "custom",
  //   render: el=>{
  //     render(h('div', {class: 'p-4'}, 'EasyUse Map'), el)
  //   }
  // })
})
</script>

<style lang="scss">
@import "@/styles/sass/main.scss";
</style>