<template>
  <BaseThumbnail :hover-zoom="hoverZoom" :is-hovered="isHovered">
    <div class="overflow-hidden w-full h-full flex items-center justify-center">
      <LazyImage
        :src="src"
        :image-class="[
          'transform-gpu transition-transform duration-300 ease-out',
          'w-full h-full object-cover'
        ]"
        :image-style="
          isHovered ? { transform: `scale(${1 + hoverZoom / 100})` } : undefined
        "
        :root-margin="rootMargin"
        :threshold="threshold"
        :immediate="immediate"
        @load="$emit('load', $event)"
        @error="$emit('error', $event)"
        @visible="$emit('visible', $event)"
      >
        <template #placeholder>
          <slot name="placeholder">
            <i class="pi pi-image text-2xl text-surface-400"></i>
          </slot>
        </template>
        <template #error>
          <slot name="error">
            <i class="pi pi-exclamation-triangle text-2xl text-surface-400"></i>
          </slot>
        </template>
      </LazyImage>
    </div>
  </BaseThumbnail>
</template>

<script setup>
import BaseThumbnail from './baseThumbnail.vue'
import LazyImage from './lazyImage.vue'

const props = defineProps({
    src: {
        type: String,
        required: true
    },
    alt: {
        type: String,
        required: true
    },
    hoverZoom: {
        type: Number,
        required: true
    },
    isHovered: {
        type: Boolean,
        default: false
    },
    isVideo: {
        type: Boolean,
        default: false
    },
    // 懒加载相关配置
    rootMargin: {
        type: String,
        default: '50px'
    },
    threshold: {
        type: Number,
        default: 0.1
    },
    immediate: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['load', 'error', 'visible'])

const { src, isVideo } = props

const isVideoType = isVideo ?? (src?.toLowerCase().endsWith('.webp') || false)
</script>
