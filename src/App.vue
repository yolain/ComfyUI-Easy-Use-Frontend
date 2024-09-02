<template lang="pug">
graphNodes
toolBar(v-if="newMenuPosition == 'Disabled'")
</template>

<script setup>
import graphNodes from "@/components/graph/index.vue";
import toolBar from "@/components/toolbar/index.vue";
import {ref, onMounted, h, render } from 'vue'

import {api, app} from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n";
import {NODES_MAP_ID} from "@/config/index";

/* Register Extensions*/
import Map from "@/components/sidebar/map/index.vue"
import {getSetting, getSettingsLookup} from "@/composable/settings.js";
const newMenuPositionID = 'Comfy.UseNewMenu'
const newMenuPosition = ref(getSetting(newMenuPositionID))
const init = _=>{
  // SideBar
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
  getSettingsLookup(newMenuPositionID, v=> {
    console.log(v)
    newMenuPosition.value = v
  })
}
onMounted(_=>{
  try {
    init()
  } catch (e) {
    console.error('Failed to init Easy Use App', e)
  }
})
</script>

<style lang="scss">
@import "@/styles/sass/main.scss";
@import "@/styles/css/index.css";
</style>