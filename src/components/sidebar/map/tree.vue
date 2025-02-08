<template lang="pug">
li(@dragstart="e=>$emit('dragstart',e,index)"
  @dragend="e=>$emit('dragend',e,index)"
  @dragover="e=>$emit('dragover',e,index)"
  :draggable="true"
  @contextmenu.stop="e=>$emit('contextmenu',e,item)")
  template(v-if="item.children?.length || item?.info?.sub_groups")
    Group(:item="item" @changeMode="$emit('changeGroupMode',item)" @mousedown="$emit('mousedown',item,'group')" @mouseup="$emit('mouseup')")
      ol
        Tree(v-for="(child,j) in item.children"
          :key="j"
          :item="child"
          :index="j"
          :showGroupOnly="showGroupOnly"
          @dragstart="$emit('dragstart',$event,j)"
          @dragend="$emit('dragend',$event,j)"
          @dragover="$emit('dragover',$event,j)"
          @contextmenu="$emit('contextmenu',$event,child)"
          @changeGroupMode="$emit('changeGroupMode',$event)"
          @changeNodeMode="$emit('changeNodeMode',$event)"
          @mousedown="$emit('mousedown',$event[0],$event[1])"
          @mouseup="$emit('mouseup')")
  template(v-else-if="!showGroupOnly")
    Node(:node="item?.info || item"
      @changeMode="$emit('changeNodeMode',item?.info || item)"
      @mousedown="$emit('mousedown',item?.info || item,'node')"
      @mouseup="$emit('mouseup')")
</template>

<script setup>
import Group from "./group.vue"
import Node from "./node.vue"

defineProps({
  item: Object,
  index: Number,
  showGroupOnly: Boolean
})

defineEmits([
  'dragstart',
  'dragend',
  'dragover',
  'contextmenu',
  'changeGroupMode',
  'changeNodeMode',
  'mousedown',
  'mouseup'
])
</script>