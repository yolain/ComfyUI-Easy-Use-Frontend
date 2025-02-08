<template lang="pug">
div(:class="prefix" :data-id="id")
  template(v-if="values?.length>0 && show")
    div(:class="[prefix + '-item',{'positive': index == 3 && type == 'sdxl' && mode == IPA_LAYER_WEIGHTS}, {'negative': index == 6 && type == 'sdxl' && mode == IPA_LAYER_WEIGHTS}]" v-for="(item,index) in values" :key="index")
      div(:class="prefix + '-item-input'") {{item.value}}
      div(:class="prefix + '-item-scroll'" ref="scroll")
        div(:class="prefix + '-item-bar'" ref="bar" :style="{'top':item.top || (100 - calculatePercent(item.default,item.min,item.max) + '%')}" @mousedown="e=>mousedown(e,item,index)" @dblclick="e=>dblclick(e,item,index)")
        div(:class="prefix + '-item-area'" :style="{'height':item.height || calculatePercent(item.default,item.min,item.max) + '%'}")
      div(:class="prefix + '-item-label'")
        span {{item.label}}
</template>

<script setup>
import { $t } from '@/composable/i18n.js'
import { ref, reactive, computed, watch, defineComponent, defineProps, defineEmits, onMounted } from 'vue'
import cloneDeep from "lodash/cloneDeep";

const prefix = 'comfyui-easyuse-slider'
defineComponent({name:prefix})

const IPA_LAYER_WEIGHTS = 'ipadapter layer weights'
const props = defineProps({
  id: {
    type: String | Number,
    default: ''
  },
  mode:{
    type: String,
    default: ''
  },
  type:{
    type: String,
    default: ''
  },
  values:{
    type: Array,
    default: []
  },
  show:{
    type:Boolean,
    default:false
  }
})
const emit = defineEmits(['changeValues','showSlider'])

const calculatePercent = (value,min,max) => ((value - min) / (max - min) * 100)
const getIPALayerDefaultValue = (length, i, v = undefined) => {
  switch (props.mode){
    case IPA_LAYER_WEIGHTS:
      let default_values = {3:2.5,6:1}
      let value = default_values[i] || 0
      return {
        default: length == 12 ? value : 0,
        min:-1,
        max:3,
        step:0.05,
        value: v!==undefined ? v : (length == 12 ? value : 0),
        top: v!==undefined ? (100 - calculatePercent(v,-1,3) + '%') : null,
        height: v!==undefined ? calculatePercent(v,-1,3) + '%' : null,
      }
  }
}

watch(_ => props.mode, async (newValue, oldValue) => {
  if(newValue!==oldValue){
    switch (newValue) {
      case IPA_LAYER_WEIGHTS:
        if(!oldValue && props.values?.length > 0){
          const array = props.values.map(item=>{
            const v = item.split(':')
            return getIPALayerDefaultValue(props.values.length, v[0], parseFloat(v[1]))
          })
          await emit('changeValues', array)
        }else{
          let length = props.type == 'sd1' ? 16 : 12
          let array = Array.from({length}, (v, i) => (getIPALayerDefaultValue(length, i)))
          await emit('changeValues', array)
        }
        break
    }
  }
  emit('showSlider')
},{
  immediate:true
})

watch(_=> props.type,  (newValue, oldValue) =>{
  if(newValue == oldValue) return
  if(props.mode == IPA_LAYER_WEIGHTS){
    let length = props.type == 'sd1' ? 16 : 12
    let array = Array.from({length}, (v, i) => (getIPALayerDefaultValue(length, i)))
    emit('changeValues', array)
  }
})

const scroll = ref(null)
const bar = ref(null)
const mousedown = (e, item, index)=>{
  let event = e || window.event;
  let _scroll = scroll.value[index]
  let _bar = bar.value[index]
  let _values = cloneDeep(props.values)
  let y = event.clientY - _bar.offsetTop;
  document.onmousemove = (e) => {
    let event = e || window.event;
    let top = event.clientY - y;
    if(top < 0){
      top = 0;
    }
    else if(top > _scroll.offsetHeight - _bar.offsetHeight){
      top = _scroll.offsetHeight - _bar.offsetHeight;
    }
    // top到最近的girdHeight值
    let girdTotal = (item.max - item.min) / item.step
    let girdHeight = (_scroll.offsetHeight - _bar.offsetHeight)/ girdTotal
    top = Math.round(top / girdHeight) * girdHeight;
    const _top = Math.floor(top/(_scroll.offsetHeight - _bar.offsetHeight)* 100) + '%';
    const _height = Math.floor((_scroll.offsetHeight - _bar.offsetHeight - top)/(_scroll.offsetHeight - _bar.offsetHeight)* 100) + '%';
    const _value = parseFloat(parseFloat(item.max - (item.max-item.min) * (top/(_scroll.offsetHeight - _bar.offsetHeight))).toFixed(2))
    _values[index] = {..._values[index],...{ top:_top, height:_height, value:_value}}
    emit('changeValues', _values)
    window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
  }
}
const dblclick = (e, item, index)=>{
  let _values = cloneDeep(props.values)
  _values[index] = {..._values[index],...{ top:null, height:null, value:item.default}}
  emit('changeValues', _values)
}
onMounted(()=>{
  document.onmouseup = _=> document.onmousemove = null;
})
</script>