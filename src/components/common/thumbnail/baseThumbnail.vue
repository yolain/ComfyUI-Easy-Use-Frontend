<template>
  <div class="relative rounded-t-lg overflow-hidden select-none">
    <div
      v-if="!error"
      ref="contentRef"
      class="w-full h-full transform-gpu transition-transform duration-1000 ease-out"
      :style="
        isHovered ? { transform: `scale(${1 + hoverZoom / 100})` } : undefined
      "
    >
      <slot />
    </div>
    <div v-else class="w-full h-full flex items-center justify-center">
      <i class="pi pi-file text-4xl" />
    </div>
  </div>
</template>

<script setup>
import { useEventListener } from '@vueuse/core'
import { onMounted, ref } from 'vue'

const error = ref(false)
const contentRef = ref(null)

const props = defineProps({
  hoverZoom: {
    type:'number',
    default: 4
  },
  isHovered: {
    type: Boolean,
    default: false
  }
})

onMounted(() => {
  const images = Array.from(contentRef.value?.getElementsByTagName('img') ?? [])
  images.forEach((img) => {
    useEventListener(img, 'error', () => {
      error.value = true
    })
  })
})
</script>
<style scoped>
img {
  transition: transform 1s cubic-bezier(0.2, 0, 0.4, 1);
}
</style>
