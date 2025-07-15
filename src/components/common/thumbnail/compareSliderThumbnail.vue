<template>
  <BaseThumbnail :is-hovered="isHovered">
    <div class="overflow-hidden w-full h-full flex items-center justify-center relative">
      <LazyImage
        :src="baseImageSrc"
        :image-class="[
          'transform-gpu transition-transform duration-300 ease-out',
          'w-full h-full object-cover block'
        ]"
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
      <div ref="containerRef" class="absolute inset-0">
        <LazyImage
          :src="overlayImageSrc"
          :image-class="[
            'transform-gpu transition-transform duration-300 ease-out',
            'w-full h-full object-cover block'
          ]"
          :image-style="{
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`
          }"
          :root-margin="rootMargin"
          :threshold="threshold"
          :immediate="immediate"
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
        <div
          class="absolute inset-y-0 bg-white/30 backdrop-blur-sm z-10 pointer-events-none"
          :style="{
            left: `${sliderPosition}%`,
            width: `1px`
          }"
        />
      </div>
    </div>
  </BaseThumbnail>
</template>

<script setup>
import { useMouseInElement } from '@vueuse/core'
import { ref, watch, defineProps } from 'vue'

import BaseThumbnail from './baseThumbnail.vue'
import LazyImage from './lazyImage.vue'

const SLIDER_START_POSITION = 50

const props = defineProps({
    baseImageSrc: {
        type: String,
        required: true
    },
    overlayImageSrc: {
        type: String,
        required: true
    },
    alt: {
        type: String,
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

const isVideoType =
    props.isVideo ||
    props.baseImageSrc?.toLowerCase().endsWith('.webp') ||
    props.overlayImageSrc?.toLowerCase().endsWith('.webp') ||
    false

const sliderPosition = ref(SLIDER_START_POSITION)
const containerRef = ref(null)

const { elementX, elementWidth, isOutside } = useMouseInElement(containerRef)

// Update slider position based on mouse position when hovered
watch(
    [() => props.isHovered, elementX, elementWidth, isOutside],
    ([isHovered, x, width, outside]) => {
        if (!isHovered) return
        if (!outside) {
            sliderPosition.value = (x / width) * 100
        }
    }
)
</script>
