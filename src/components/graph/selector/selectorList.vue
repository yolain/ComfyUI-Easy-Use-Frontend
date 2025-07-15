<template>
  <div class="list-item">
    <span 
      :class="['list-item__tag', { 'selected': isSelected }]" 
      @click="handleItemClick"
      @mouseenter="handleItemHover"
      @mouseleave="handleItemLeave"
    >
      <input 
        v-if="selectable"
        type="checkbox" 
        :name="item.name"
        :checked="isSelected"
        @click.stop
      />
      <span class="list-item-content">
        <div class="list-title">{{ locale == 'zh' ? item.name_cn : item.name }}</div>
      </span>
    </span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

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
      description: 'description'
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

// 处理操作点击
const handleAction = (action, item) => {
  emit('action', { action: action.name, item, actionConfig: action })
}
</script>

<style scoped>
.list-item {
  display: inline-block;
  position: relative;
}

.list-item__tag {
  display: inline-block;
  vertical-align: middle;
  margin-top: 8px;
  margin-right: 8px;
  padding: 4px;
  color: var(--input-text);
  background-color: var(--bg-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
  font-size: 11px;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: all 0.2s ease;
}

.list-item__tag:hover {
  filter: brightness(1.2);
}

.list-item__tag input[type=checkbox] {
  --ring-color: transparent;
  position: relative;
  box-shadow: none;
  border: 1px solid var(--border-color);
  border-radius: 2px;
  background: linear-gradient(135deg, var(--comfy-menu-bg) 0%, var(--comfy-input-bg) 60%);
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
  appearance: none;
  border: 1px solid var(--border-color);
  background-origin: border-box;
  padding: 0;
  width: 1rem;
  height: 1rem;
  border-radius: 4px;
  color: var(--theme-color);
  user-select: none;
  margin-right: 4px;
}

.list-item__tag input[type=checkbox]:checked {
  border: 1px solid var(--theme-color);
  background-color: var(--theme-color);
  background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e");
}

.list-item-content {
  margin: 0 4px;
  vertical-align: middle;
  display: inline-block;
}

.list-title {
  color: inherit;
  font-size: 10px;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
  display: block;
}

.list-description {
  color: var(--input-text);
  font-size: 10px;
  line-height: 1.4;
  margin: 2px 0 0 0;
  opacity: 0.8;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .list-item__tag {
    padding: 6px;
    margin-right: 6px;
    margin-top: 6px;
  }
}

@media (max-width: 480px) {
  .list-item__tag {
    padding: 4px;
    margin-right: 4px;
    margin-top: 4px;
  }
  
  .list-title {
    font-size: 11px;
  }
  
  .list-description {
    font-size: 9px;
  }
}
</style>