<template lang="pug">
div.flex-c(:class="prefix")
  div.group.flex-c(:class="prefix+'-icon'" @click="isNodesMapShow = !isNodesMapShow")
    svg(t="1714565543756" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="22538" width="200" height="200")
      path(d="M871.616 64H152.384c-31.488 0-60.416 25.28-60.416 58.24v779.52c0 32.896 26.24 58.24 60.352 58.24h719.232c34.112 0 60.352-25.344 60.352-58.24V122.24c0.128-32.96-28.8-58.24-60.288-58.24zM286.272 512c-23.616 0-44.672-20.224-44.672-43.008 0-22.784 20.992-43.008 44.608-43.008 23.616 0 44.608 20.224 44.608 43.008A43.328 43.328 0 0 1 286.272 512z m0-202.496c-23.616 0-44.608-20.224-44.608-43.008 0-22.784 20.992-43.008 44.608-43.008 23.616 0 44.608 20.224 44.608 43.008a43.456 43.456 0 0 1-44.608 43.008zM737.728 512H435.904c-23.68 0-44.672-20.224-44.672-43.008 0-22.784 20.992-43.008 44.608-43.008h299.264c23.616 0 44.608 20.224 44.608 43.008a42.752 42.752 0 0 1-41.984 43.008z m0-202.496H435.904c-23.616 0-44.608-20.224-44.608-43.008 0-22.784 20.992-43.008 44.608-43.008h299.264c23.616 0 44.608 20.224 44.608 43.008a42.88 42.88 0 0 1-42.048 43.008z" p-id="22539" fill="currentColor")
  div.rocket.flex-c(:class="prefix+'-icon'" @click="cleanVRAM")
    svg(t="1714565020764" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="7999" width="200" height="200")
      path(d="M810.438503 379.664884l-71.187166-12.777183C737.426025 180.705882 542.117647 14.602496 532.991087 7.301248c-12.777184-10.951872-32.855615-10.951872-47.45811 0-9.12656 7.301248-204.434938 175.229947-206.26025 359.586453l-67.536542 10.951871c-18.253119 3.650624-31.030303 18.253119-31.030303 36.506239v189.832442c0 10.951872 5.475936 21.903743 12.777184 27.379679 7.301248 5.475936 14.602496 9.12656 23.729055 9.12656h5.475936l133.247772-23.729055c40.156863 47.458111 91.265597 73.012478 151.500891 73.012477 60.235294 0 111.344029-27.379679 151.500891-74.837789l136.898396 23.729055h5.475936c9.12656 0 16.427807-3.650624 23.729055-9.12656 9.12656-7.301248 12.777184-16.427807 12.777184-27.379679V412.520499c1.825312-14.602496-10.951872-29.204991-27.379679-32.855615zM620.606061 766.631016H401.568627c-20.078431 0-36.506239 16.427807-36.506238 36.506239v109.518716c0 14.602496 9.12656 29.204991 23.729055 34.680927 14.602496 5.475936 31.030303 1.825312 40.156863-9.126559l16.427807-18.25312 32.855615 80.313726c5.475936 14.602496 18.253119 23.729055 34.680927 23.729055 16.427807 0 27.379679-9.12656 34.680927-23.729055l32.855615-80.313726 16.427807 18.25312c10.951872 10.951872 25.554367 14.602496 40.156863 9.126559 14.602496-5.475936 23.729055-18.253119 23.729055-34.680927v-109.518716c-3.650624-20.078431-20.078431-36.506239-40.156862-36.506239z" fill="currentColor" p-id="8000")
div(ref="nodesMapRef" :class="prefix+'-nodes-map'" v-if="isNodesMapShow")
  NodesMap(@handleHeader="moveNodesMap")
    template(#icon)
      Button(icon="pi pi-times" text rounded severity="secondary" @click="isNodesMapShow = false" size="small" v-tooltip.top="$t('Close')" )
</template>

<script setup>
import {ref, onMounted, watch} from 'vue'
import {api} from "@/composable/comfyAPI.js";
import {cleanVRAM} from "@/composable/easyuseAPI.js";
import {toast} from "@/components/toast.js";
import {$t} from "@/composable/i18n.js";
import NodesMap from "@/components/sidebar/map/nodesMap.vue";
import Button from "primevue/button";
import vTooltip from 'primevue/tooltip';

const prefix = 'comfyui-easyuse-toolbar'


import {useNodesStore} from "@/stores/nodes.js";
const store = useNodesStore()
const isNodesMapShow = ref(false)
watch(_=>isNodesMapShow.value, val=>{
  if(val) {
    store.watchGraph(true)
  }
  else store.unwatchGraph()
})

const nodesMapRef = ref(null)
const moveNodesMap = (e) =>{
  const div = nodesMapRef.value
  var startX = e.clientX || 0
  var startY = e.clientY || 0
  var offsetX = div.offsetLeft
  var offsetY = div.offsetTop

  function moveBox (e) {
    var newX = e.clientX
    var newY = e.clientY
    var deltaX = newX - startX
    var deltaY = newY - startY
    div.style.left = offsetX + deltaX + 'px'
    div.style.top = offsetY + deltaY + 'px'
  }

  function stopMoving () {
    document.removeEventListener('mousemove', moveBox)
    document.removeEventListener('mouseup', stopMoving)
  }

  document.addEventListener('mousemove', moveBox)
  document.addEventListener('mouseup', stopMoving)
}
</script>