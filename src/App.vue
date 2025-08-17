<template lang="pug">
graphNodes
img#easyuse-model-thumbnail
toolBar(v-if="newMenuPosition == 'Disabled'")
domWidgets
</template>

<script setup>
import graphNodes from "@/components/graph/index.vue";
import toolBar from "@/components/toolbar/index.vue";
import domWidgets from "@/components/graph/domWidgets.vue";
import {ref, onMounted, h, render } from 'vue'

import {api, app} from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n";
import {NODES_MAP_ID} from "@/constants/index";

/* Register Extensions*/
import Map from "@/components/sidebar/map/index.vue"
import {getSetting, getSettingsLookup} from "@/composable/settings.js";
const newMenuPositionID = 'Comfy.UseNewMenu'
const newMenuPosition = ref(null)


const init = async()=>{
  const enableNodesMap = getSetting('EasyUse.NodesMap.Enable', null)
  // SideBar
  if (enableNodesMap){
    app.extensionManager.registerSidebarTab({
      id: NODES_MAP_ID,
      icon: 'pi pi-sitemap',
      title: $t("NodesMap", true),
      tooltip: $t("NodesMap", true),
      type: 'custom',
      render: el => {
        el.style.height = '100%'
        render(h(Map,{}),el)
      }
    })
  }
  // About
  const resp = await api.fetchApi(`/easyuse/version`);
  if (resp.status === 200) {
    let data = await resp.json();
    if(data.version){
      app.registerExtension({
        name: 'EasyUse Version',
        aboutPageBadges: [
          {
            label: `EasyUse v` + data.version,
            url: 'https://github.com/yolain/ComfyUI-Easy-Use',
            icon: 'pi pi-github'
          }
        ]
      })
    }
  }
  newMenuPosition.value = getSetting(newMenuPositionID)
  getSettingsLookup(newMenuPositionID, v=> {
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