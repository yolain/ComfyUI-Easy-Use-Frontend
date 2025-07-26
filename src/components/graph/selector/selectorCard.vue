<template>
  <div class="selector-card-wrapper">
    <div 
      ref="cardRef"
      class="card-item"
      :class="{ 
        'selected': isSelected,
        'clickable': selectable 
      }"
      @click="handleItemClick"
      @mouseenter="handleItemHover"
      @mouseleave="handleItemLeave"
    >
      <!-- 图片区域 -->
      <div class="card-image-container">
        <template v-if="item.thumbnailVariant === 'compareSlider'">
          <CompareSliderThumbnail
            :base-image-src="item.thumbnail[0]"
            :overlay-image-src="item.thumbnail[1]"
            :alt="title"
            :is-hovered="isHovered"
            :is-video="
              item.mediaType === 'video' ||
              item.mediaSubtype === 'webp'
            "
            class="card-image"
          />
        </template>
        <template v-else>
          <DefaultThumbnail
            :src="item.thumbnail || ''"
            :alt="locale == 'zh' ? item.name_cn : item.name"
            :hover-zoom="4"
            :is-hovered="false"
            class="card-image"
          />
        </template>
        
        <!-- 选择指示器 -->
        <div v-if="selectable && isSelected" class="selection-badge">
          <i class="pi pi-check text-white"></i>
        </div>
      </div>
      
      <!-- 内容区域 -->
      <div class="card-content">
        <div class="card-title">
          {{ locale == 'zh' ? item.name_cn : item.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DefaultThumbnail from '@/components/common/thumbnail/defaultThumbnail.vue'
import CompareSliderThumbnail from '@/components/common/thumbnail/compareSliderThumbnail.vue'
import Skeleton from 'primevue/skeleton'

// Props 定义
const props = defineProps({
  // 单个数据项
  item: {
    type: Object,
    required: true
  },
  uniqueKey: {
    type: String,
    default: 'id'
  },
  // 是否可选择
  selectable: {
    type: Boolean,
    default: false
  },
  // 是否被选中
  isSelected: {
    type: Boolean,
    default: false
  },
  // 是否多选
  multiple: {
    type: Boolean,
    default: false
  },
  // 是否显示描述
  showDescription: {
    type: Boolean,
    default: true
  },
  // 是否显示元信息
  showMeta: {
    type: Boolean,
    default: false
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: false
  },
  // 操作按钮配置
  actions: {
    type: Array,
    default: () => []
  },
  // 数据字段映射
  itemFields: {
    type: Object,
    default: () => ({
      id: 'id',
      title: 'title',
      description: 'description',
      image: 'image',
      meta: 'meta'
    })
  },
  locale:{
    type: String,
    default: 'en'
  }
})

// Emit 定义
const emit = defineEmits([
  'select',        // 选择项时触发
  'action',        // 执行操作时触发
  'item-hover',    // 鼠标悬停项时触发
  'item-leave'     // 鼠标离开项时触发
])

import { useElementHover } from '@vueuse/core'
const cardRef = ref(null)
const isHovered = useElementHover(cardRef)

// 处理项目点击
const handleItemClick = () => {
  if (!props.selectable) return
  emit('select', props.item)
}

// 处理项目悬停
const handleItemHover = () => {
  emit('item-hover', props.item)
}

// 处理项目离开
const handleItemLeave = () => {
  emit('item-leave', props.item)
}

</script>

<style scoped>
.selector-card-wrapper {
  width: 100%;
}

.card-item {
  border:1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--comfy-menu-bg);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .card-item {
  background-color: var(--surface-900);
  border-color: var(--surface-700);
}

.card-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border:1px solid var(--input-text);
  /* transform: translateY(-2px); */
}

.card-item.clickable {
  cursor: pointer;
}

.card-item.selected {
  border:1px solid var(--success-color, #4CAF50);
}

.card-image-container {
  position: relative;
}

.card-image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  transition: transform 0.2s ease;
  background: var(--bg-color);
}

.card-item:hover .card-image {
  transform: scale(1.05);
}

.selection-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 10px;
  height: 10px;
  background-color: var(--success-color, #4CAF50);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 10;
  animation: scaleIn 0.2s ease-out;
}

.selection-badge i{
  font-size: 6px;
  font-weight: bold;
  color: white;
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.card-actions {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-item:hover .card-actions {
  opacity: 1;
}

.card-content {
  padding: 2px 4px;
}

.card-title {
  color: var(--input-text);
  font-size: 8px;
  font-weight: 400;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.25;
  transition: color 0.2s ease;
}

.dark .card-title {
  color: var(--surface-0);
}

.card-item.selected .card-title {
  color: var(--primary-600);
  font-weight: 500;
}

.dark .card-item.selected .card-title {
  color: var(--primary-300);
}
</style>