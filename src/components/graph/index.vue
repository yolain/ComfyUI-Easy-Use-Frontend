<template lang="pug">
sliderControl(:ref="e=>{if(e) slidersRef[item.id] = e}" :type="item.type"  v-for="(item,index) in slider_controls" :key="index" :id="item.id" :show="item.show" :mode="item.mode" :values="item.value" @changeValues="val=>changeSlider(val,index)" @showSlider="showSlider(index)")
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {app} from "@/composable/comfyAPI";
import sleep from "@/composable/sleep";
import cloneDeep from 'lodash/cloneDeep'

// store
import {storeToRefs} from "pinia";
import {useGraphStore} from "@/stores/graph";
const store = useGraphStore()
const {slider_controls} = storeToRefs(store)

import {getWidgetByName} from "@/composable/node.js";


// sliderControl
import sliderControl from '@/components/graph/sliderControl.vue'
const slidersRef = ref({})
const changeSlider = (val,index) => {
  let _sliders = cloneDeep(slider_controls.value)
  _sliders[index].value = val
  store.setSliderControls(_sliders)
}
const showSlider = (index) => {
  let _sliders = cloneDeep(slider_controls.value)
  _sliders[index].show = true
  store.setSliderControls(_sliders)
}
const createSliderControl = async(node)=>{
  await sleep(1)
  const mode_widget = getWidgetByName(node,'mode')
  const type_widget = getWidgetByName(node, 'model_type')
  const old_values =node.properties['values']?.length>0 ?node.properties['values'] : []
  console.log(`ID:${node.id} old_values:`,old_values)

  // add slider
  if(node.flags?.collapsed) node.collapse()
  let _slider_controls = cloneDeep(slider_controls.value)
  _slider_controls.push({id:node.id, type:type_widget.value ,mode:mode_widget.value, value:old_values, show:false})
  const slider_index = _slider_controls.length - 1
  await store.setSliderControls(_slider_controls)

  let divs = slidersRef.value
  let div = divs[node.id]?.['_']?.vnode?.el
  if(!div) return
  node.addDOMWidget('values','btn', div, {
    setValue(){},
    getValue(){
      const values = slider_controls.value?.[slider_index].value || []
      node.properties['values'] = values.map((v,i)=> (`${i}:${v.value}`))
      return node.properties['values'].join(',')
    }
  });
  if(!node.properties['values']) node.setProperty('values', [])

  node.setSize(type_widget.value == 'sdxl' ? [375,320] : [455,320])
  type_widget.callback = v => {
    _slider_controls = cloneDeep(slider_controls.value)
    if(_slider_controls[slider_index]['type'] == v) return
    node.setSize(v == 'sdxl' ? [375,320] : [455,320])
    _slider_controls[slider_index]['value'] = []
    _slider_controls[slider_index]['type'] = v
    store.setSliderControls(_slider_controls)
  }

  // removed
  const onRemoved = node.onRemoved;
  node.onRemoved = function() {
    onRemoved ? onRemoved?.apply(this, arguments) : undefined;
    let _s_index = slider_controls.value.findIndex(cate=> cate.id == node.id)
    if(_s_index !== undefined){
      let _s = cloneDeep(slider_controls.value)
      _s.splice(slider_index,1)
      store.setSliderControls(_s)
    }
    return onRemoved;
  }
}

/* Register Extensions*/
onMounted(_=>{
  // Components
  app.registerExtension({
    name: 'Comfy.EasyUse.Components',
    async beforeRegisterNodeDef(nodeType,nodeData) {
      const onNodeCreated = nodeType.prototype.onNodeCreated;
   
      // Slider Control
      if(nodeData.name == 'easy sliderControl') {
        nodeType.prototype.onNodeCreated = async function () {
          onNodeCreated ? onNodeCreated?.apply(this, arguments) : undefined;
          await createSliderControl(this)
          return onNodeCreated;
        }
      }
      // Pose Editor
      if(nodeData.name == 'easy poseEditor'){
        nodeType.prototype.onNodeCreated = async function() {
          onNodeCreated ? onNodeCreated?.apply(this, arguments) : undefined;
          const editor = document.createElement('div')
          editor.className = 'comfyui-easyuse-poseEditor'
          editor.innerHTML = `<div>This node is about to be removed, you can use <a href="https://github.com/AlekPet/ComfyUI_Custom_Nodes_AlekPet" target="_blank">ComfyUI_Custom_Nodes_AlekPet</a> to replace it.</div>`
          this.addDOMWidget('editor','btn', editor)
          return onNodeCreated;
        }
      }
    }
  })
})
</script>