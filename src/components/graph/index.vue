<template lang="pug">
stylesSelector(:ref="e=>{if(e) selectorsRef[item.id] = e}" :type="item.type" v-for="(item,index) in selectors" :key="index" :id="item.id" :show="item.show" :selectedStyles="item.value" @chooseStyle="styles=>chooseStyle(styles,index)")
segSelector(:ref="e=>{if(e) segsRef[item.id] = e}" :type="item.type" v-for="(item,index) in seg_selectors" :key="index" :id="item.id" :show="item.show" :selected="item.value" @select="segs=>selectSegs(segs,index)")
sliderControl(:ref="e=>{if(e) slidersRef[item.id] = e}" :type="item.type"  v-for="(item,index) in slider_controls" :key="index" :id="item.id" :show="item.show" :mode="item.mode" :values="item.value" @changeValues="val=>changeSlider(val,index)" @showSlider="showSlider(index)")
</template>

<script setup>
import {ref, onMounted, watch, h, render, defineComponent} from 'vue'
import {app} from "@/composable/comfyAPI";
import sleep from "@/composable/sleep";
import cloneDeep from 'lodash/cloneDeep'

defineComponent({name:'CanvasNodes'})
// store
import {storeToRefs} from "pinia";
import {useGraphStore} from "@/stores/graph";
const store = useGraphStore()
const {selectors, seg_selectors, slider_controls} = storeToRefs(store)

import {getWidgetByName, toggleWidget} from "@/composable/node.js";

// stylesSelector
import stylesSelector from '@/components/graph/stylesSelector.vue'
const selectorsRef = ref({})
const chooseStyle = (styles,index) => {
  let _selectors = cloneDeep(selectors.value)
  _selectors[index].value = styles
  store.setSelectors(_selectors)
}
const createStylesSelector = async(node) => {
  await sleep(1)
  const styles_type_widget = getWidgetByName(node, 'styles')
  const old_values = node.properties['values']?.length > 0 ? node.properties['values'] : []
  console.log(`ID:${node.id} old_values:`,old_values)

  // add selector
  let _selectors = cloneDeep(selectors.value)
  _selectors.push({id:node.id, type:styles_type_widget.value, value:old_values, show:false})
  const selector_index = _selectors.length - 1
  await store.setSelectors(_selectors)

  // bind selector to canvas node
  let selector_divs = selectorsRef.value
  let selector_div = selector_divs[node.id]?.['_']?.vnode?.el
  if(!selector_div) return
  let selector = node.addDOMWidget('select_styles','btn', selector_div);
  if(!node.properties['values']) node.setProperty('values', [])
  _selectors[selector_index]['show'] = true
  await store.setSelectors(_selectors)

  // switch styles type
  let styles_value = styles_type_widget.value
  Object.defineProperty(styles_type_widget, 'value',{
    set:value=>{
      styles_value = value
      _selectors[selector_index]['type'] = value
      node.properties['values'] = []
      _selectors[selector_index]['value'] = []
      store.setSelectors(_selectors)
    },
    get:_=>styles_value
  })
  // selector
  Object.defineProperty(selector, 'value',{
    set:value=>{
      setTimeout(_=>{
        _selectors[selector_index].value = value.split(',')
        store.setSelectors(_selectors)
      },150)
    },
    get:_=>{
      node.properties['values'] = selectors.value?.[selector_index]?.value || []
      return node.properties['values'].join(',')
    }
  })
  if(node.size?.[0]<150 || node.size?.[1]<150) node.setSize([425, 500]);

  // removed
  const onRemoved = node.onRemoved;
  node.onRemoved = function() {
    onRemoved ? onRemoved?.apply(this, arguments) : undefined;
    let _s_index = selectors.value.findIndex(cate=> cate.id == node.id)
    if(_s_index !== undefined){
      let _s = cloneDeep(selectors.value)
      _s.splice(selector_index,1)
      store.setSelectors(_s)
    }
    return onRemoved;
  }
}


// human segmentation
import segSelector from '@/components/graph/segSelector.vue'
const segsRef = ref({})
const selectSegs = (segs,index) => {
  let _segs = cloneDeep(seg_selectors.value)
  _segs[index].value = segs
  store.setSegSelectors(_segs)
}
const createHumanSegmentation = async(node) => {
  await sleep(1)
  const method_widget = getWidgetByName(node, 'method')
  const old_values = node.properties['values']?.length>0 ? node.properties['values'] : []
  console.log(`ID:${node.id} old_values:`,old_values)

  // add selector
  let _seg_selectors = cloneDeep(seg_selectors.value)
  _seg_selectors.push({id:node.id, type:method_widget.value, value:old_values, show:false})
  const selector_index = _seg_selectors.length - 1
  await store.setSegSelectors(_seg_selectors)

  // bind selector to canvas node
  let selector_divs = segsRef.value
  let selector_div = selector_divs[node.id]?.['_']?.vnode?.el
  if(!selector_div) return
  let selector = node.addDOMWidget('mask_components','btn', selector_div);
  if(!node.properties['values']) node.setProperty('values', [])
  _seg_selectors[selector_index]['show'] = true
  await store.setSegSelectors(_seg_selectors)

  // switch method
  let method_value = method_widget.value
  Object.defineProperty(method_widget, 'value',{
    set:value=>{
      method_value = value
      _seg_selectors[selector_index]['type'] = value
      node.properties['values'] = []
      _seg_selectors[selector_index]['value'] = []
      toggleWidget(node, getWidgetByName(node, 'confidence'), method_value === 'selfie_multiclass_256x256' ? true : false)
      node.setSize([300, method_value === 'selfie_multiclass_256x256' ? 260 : 500]);
      store.setSegSelectors(_seg_selectors)
    },
    get:_=>method_value
  })
  // selector
  Object.defineProperty(selector, 'value',{
    set:value=>{
      setTimeout(_=>{
        _seg_selectors[selector_index].value = value.split(',')
        store.setSegSelectors(_seg_selectors)
      },150)
    },
    get:_=>{
      node.properties['values'] = seg_selectors.value?.[selector_index].value || []
      return node.properties['values'].join(',')
    }
  })

  toggleWidget(node, getWidgetByName(node, 'confidence'), method_value === 'selfie_multiclass_256x256' ? true : false)
  node.setSize([300, method_value === 'selfie_multiclass_256x256' ? 260 : 500]);

  // removed
  const onRemoved = node.onRemoved;
  node.onRemoved = function() {
    onRemoved ? onRemoved?.apply(this, arguments) : undefined;
    let _s_index = seg_selectors.value.findIndex(cate=> cate.id == node.id)
    if(_s_index !== undefined){
      let _s = cloneDeep(seg_selectors.value)
      _s.splice(selector_index,1)
      store.setSegSelectors(_s)
    }
    return onRemoved;
  }
}

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
  let _slider_controls = cloneDeep(slider_controls.value)
  _slider_controls.push({id:node.id, type:type_widget.value ,mode:mode_widget.value, value:old_values, show:false})
  const slider_index = _slider_controls.length - 1
  await store.setSliderControls(_slider_controls)

  let divs = slidersRef.value
  let div = divs[node.id]?.['_']?.vnode?.el
  if(!div) return
  let sliders =node.addDOMWidget('values','btn', div);
  if(!node.properties['values']) node.setProperty('values', [])

  Object.defineProperty(sliders, 'value',{
    set: function() {},
    get:_=>{
      const values = slider_controls.value?.[slider_index].value || []
      node.properties['values'] = values.map((v,i)=> (`${i}:${v.value}`))
      return node.properties['values'].join(',')
    }
  })

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
      // Styles Selector
      if(nodeData.name == 'easy stylesSelector'){
        nodeType.prototype.onNodeCreated = async function() {
          onNodeCreated ? onNodeCreated?.apply(this, arguments) : undefined;
          await createStylesSelector(this)
          return onNodeCreated;
        }
      }
      // Human Segmentation
      if(nodeData.name == 'easy humanSegmentation'){
        nodeType.prototype.onNodeCreated = async function() {
          onNodeCreated ? onNodeCreated?.apply(this, arguments) : undefined;
          await createHumanSegmentation(this)
          return onNodeCreated;
        }
      }
      // Slider Control
      if(nodeData.name == 'easy sliderControl') {
        nodeType.prototype.onNodeCreated = async function () {
          onNodeCreated ? onNodeCreated?.apply(this, arguments) : undefined;
          await createSliderControl(this)
          return onNodeCreated;
        }
      }
    }
  })
})
</script>