<template>
  <div ref="containerRef" class="lazy-image-container">
    <div
        v-if="hasError"
        :class="[
        'lazy-image-error',
        'w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800',
        errorClass
      ]"
    >
      <slot name="error">
        <i class="pi pi-exclamation-triangle text-2xl text-surface-400"></i>
      </slot>
    </div>
    <img
      v-else-if="shouldLoad && imageSrc"
      :src="imageSrc"
      :alt="alt"
      :class="imageClass"
      :style="imageStyle"
      draggable="false"
      @load="handleLoad"
      @error="handleError"
    />
    <div 
      v-else-if="!shouldLoad"
      :class="[
        'lazy-image-placeholder',
        'w-full h-full flex items-center justify-center bg-surface-100 dark:bg-surface-800',
        placeholderClass
      ]"
    >
      <slot name="placeholder">
        <i class="pi pi-image text-2xl text-surface-400"></i>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { useIntersectionObserver } from '@vueuse/core'
import { ref, computed, watch } from 'vue'

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    default: ''
  },
  imageClass: {
    type: [String, Array, Object],
    default: ''
  },
  imageStyle: {
    type: [String, Object],
    default: () => ({})
  },
  placeholderClass: {
    type: [String, Array, Object],
    default: ''
  },
  errorClass: {
    type: [String, Array, Object],
    default: ''
  },
  // 懒加载选项
  rootMargin: {
    type: String,
    default: '50px'
  },
  threshold: {
    type: Number,
    default: 0.1
  },
  // 是否立即加载（不使用懒加载）
  immediate: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load', 'error', 'visible'])

// 状态管理
const containerRef = ref(null)
const shouldLoad = ref(props.immediate)
const isLoaded = ref(false)
const hasError = ref(false)
const imageSrc = computed(() => props.src)

// 重置状态当 src 改变时
watch(() => props.src, () => {
  isLoaded.value = false
  hasError.value = false
  if (!props.immediate) {
    shouldLoad.value = false
  }
}, { immediate: true })

// 使用 Intersection Observer 进行懒加载
const { stop } = useIntersectionObserver(
  containerRef,
  ([entry]) => {
    if (entry?.isIntersecting && !shouldLoad.value) {
      shouldLoad.value = true
      emit('visible')
      // 一旦开始加载，就停止观察
      stop()
    }
  },
  {
    rootMargin: props.rootMargin,
    threshold: props.threshold
  }
)

// 处理图片加载成功
const handleLoad = (event) => {
  isLoaded.value = true
  hasError.value = false
  emit('load', event)
}

// 处理图片加载错误
const handleError = (event) => {
  hasError.value = true
  isLoaded.value = false
  emit('error', event)
}
</script>

<style scoped>
.lazy-image-container {
  position: relative;
  width: 100%;
  height: 100%;
}
.lazy-image-placeholder,
.lazy-image-error {
  transition: background-color 0.2s ease;
}

img {
  transition: opacity 0.3s ease;
}
</style>
