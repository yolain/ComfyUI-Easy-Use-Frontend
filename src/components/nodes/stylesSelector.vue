<template lang="pug">
div(:class="prefix + ` ${prefix}-styles`", :data-id="id" v-click-outside="hiddenImage")
  template(v-if="styles.length>0 && show")
    div(:class="prefix+'__header'")
      div(:class="prefix+'__header_button'" @click="reset()")
        i.mdi.mdi-trash-can
      div(:class="prefix+'__header_search'")
        i.mdi.mdi-magnify
        textarea.search(v-model="search_value" dir="ltr", :rows="1", :placeholder="$t('Type here to search styles ...')")
    div(:class="prefix+'__content'" @mouseleave="sortStyles")
      div(:class="prefix+'-item'" v-for="(item,index) in styles", :key="index", @mouseenter="displayImage(item)",  @mouseleave="hiddenImage(item)")
        span(:class="[prefix+'-item__tag',{'hide':!selectedStyles.includes(item.name) && l(item.name).indexOf(l(search_value)) == -1 && (!item.name_cn || l(item.name_cn).indexOf(l(search_value)) == -1)}]" @click="chooseStyle(item)")
          input(type="checkbox" :name="item.name", :checked="selectedStyles.includes(item.name)")
          span {{locale == 'zh-CN' && item.name_cn ? item.name_cn : item.name}}
    div(:class="prefix+'-preview'" v-if="preview?.src")
      img(:src="preview.src" ref="image", alt="preview" @error="errorImage")
      div(:class="prefix+'-preview__text'")
        b {{preview.name}}
        div(:class="prefix+'-preview__prompt'")
          h6(v-if="preview.positive")
            span.comfyui-easyuse-success positive:
            span {{preview.positive}}
          h6(v-if="preview.negative")
            span.comfyui-easyuse-error negative:
            span {{preview.negative}}
</template>

<script setup>
import {api } from '@/composable/comfyAPI'
import { $t,locale } from '@/composable/i18n'
import {toast} from '@/components/toast'
import { ref, reactive, computed, watch, defineComponent, defineProps, defineEmits, onMounted } from 'vue'
import vClickOutside from "@/directive/clickOutside";

const prefix = 'comfyui-easyuse-selector'
defineComponent({name:prefix+'-styles'})

const props = defineProps({
  id: {
    type: String | Number,
    default: ''
  },
  type:{
    type: String,
    default: ''
  },
  selectedStyles:{
    type: Array,
    default: []
  },
  show:{
    type: Boolean,
    default: false
  }
})

import {storeToRefs} from "pinia";
import {useGraphStore} from "@/stores/graph.js";
const store = useGraphStore()
const {selectors_styles} = storeToRefs(store)

import cloneDeep from "lodash/cloneDeep";
const styles = ref([])
const getStylesList = async(name) =>{
  if(selectors_styles.value[props.type]) return true
  const resp = await api.fetchApi(`/easyuse/prompt/styles?name=${name}`);
  if (resp.status === 200) {
    let data = await resp.json();
    let _styles = data.map((i,index)=> {i.index = index;return i})
    await store.setStyles(props.type, _styles)
    return true
  }else {
    toast.error($t('Get styles list Failed'))
    return false
  }
}
watch(_ => props.type, async(name) => {
  styles.value = []
  if(!name) return
  await getStylesList(name) && sortStyles()
},{
  immediate:true
})


const emit = defineEmits(['chooseStyle'])
const chooseStyle = (item) => {
  let selectedStyles = props.selectedStyles
  if(selectedStyles.includes(item.name)){
    selectedStyles = selectedStyles.filter(i => i !== item.name)
  }else{
    selectedStyles.push(item.name)
  }
  emit('chooseStyle', selectedStyles)
}
const sortStyles = _=>{
  const selectedStyles = props.selectedStyles
  const select = cloneDeep(selectors_styles.value[props.type])
  styles.value = select.sort((a,b)=> a.index - b.index).sort((a,b) => selectedStyles.includes(b.name) - selectedStyles.includes(a.name))
}


// search
const search_value = ref('')
const l = str => str.toLowerCase()
const reset = _=>{
  emit('chooseStyle', [])
  search_value.value = ''
}

// image
const preview = reactive({})
const displayImage = async(item) =>{
  if(item.imageShow) return
  if(!item.imageSrc){
    if(item.imageLoading) return
    item.imageLoading = true
    const url = await getStyleImage(item.imgName).finally(()=> item.imageLoading = false)
    item.imageSrc = url
  }
  item.imageShow = true
  preview.name = locale == 'zh-CN' && item.name_cn ? item.name_cn : item.name
  preview.positive = item.prompt
  preview.negative = item.negative_prompt
  preview.src = item.imageSrc
}
const hiddenImage = item => {
  item.imageShow = false
  preview.src = ''
  preview.name = ''
  preview.positive = ''
  preview.negative = ''
}
const getStyleImage = async(name) =>{
  const resp = await api.fetchApi(`/easyuse/prompt/styles/image?name=${name}&styles_name=${props.type}`);
  if (resp.status === 200) {
    const text = await resp.text()
    if(text.startsWith('http')) return text
    const url = `/easyuse/prompt/styles/image?name=${name}&styles_name=${props.type}`
    return url
  }else {
    // toast.error($t('Get style image Failed'))
    return undefined
  }
}
const errorImage = e =>{
  const empty_img = "data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QNLaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA5LjEtYzAwMSA3OS4xNDYyODk5Nzc3LCAyMDIzLzA2LzI1LTIzOjU3OjE0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjUuMSAoMjAyMzA5MDUubS4yMzE2IDk3OWM4NmQpICAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RjA3NEU1QzNCNUJBMTFFRUExMUVDNkZDRjI0NzlBN0QiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RjA3NEU1QzRCNUJBMTFFRUExMUVDNkZDRjI0NzlBN0QiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpGMDc0RTVDMUI1QkExMUVFQTExRUM2RkNGMjQ3OUE3RCIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpGMDc0RTVDMkI1QkExMUVFQTExRUM2RkNGMjQ3OUE3RCIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/uAA5BZG9i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"
  e.target.src = empty_img
}
</script>