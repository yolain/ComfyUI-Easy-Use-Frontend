<template lang="pug">
div(:class="prefix + ` ${prefix}-seg`" :data-id="id")
  template(v-if="mask_components?.length>0 && show")
    div(:class="prefix+'-item'" v-for="(item,index) in mask_components" :key="index")
      span(:class="prefix+'-item__tag'" @click="chooseCom(item)")
        input(type="checkbox" :name="item" :checked="selected.includes(item)")
        span {{$t(item)}}
</template>

<script setup>
import { $t,locale } from '@/composable/i18n'
import { ref, reactive, computed, watch, defineComponent, defineProps, defineEmits, onMounted } from 'vue'
import cloneDeep from "lodash/cloneDeep";


const prefix = 'comfyui-easyuse-selector'
defineComponent({name:prefix+'-seg'})

const props = defineProps({
  id: {
    type: String | Number,
    default: ''
  },
  type:{
    type: String,
    default: ''
  },
  selected:{
    type: Array,
    default: []
  },
  show:{
    type: Boolean,
    default: false
  }
})

const mask_components = ref([])
watch(_ => props.type, async(name) => {
  switch (name){
    case 'selfie_multiclass_256x256':
      mask_components.value = ["Background", "Hair", "Body", "Face", "Clothes", "Others"]
      break
    case 'human_parsing_lip':
      mask_components.value = ["Background","Hat","Hair","Glove","Sunglasses","Upper-clothes","Dress","Coat","Socks","Pants","Jumpsuits","Scarf","Skirt","Face","Left-arm","Right-arm","Left-leg","Right-leg","Left-shoe","Right-shoe"]
      break
  }
},{
  immediate:true
})

const emit = defineEmits(['select'])
const chooseCom = (item) => {
  let selected = cloneDeep(props.selected)
  if(selected.includes(item)){
    selected = selected.filter(i => i !== item)
  }else{
    selected.push(item)
  }
  emit('select', selected)
}
</script>