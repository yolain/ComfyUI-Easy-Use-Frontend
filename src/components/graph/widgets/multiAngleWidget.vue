<template>
  <div class="flex flex-col easyuse-multiangle-widget">
    
    <!-- Tabs -->
    <div class="easyuse-multiangle-tabs flex items-center gap-1 px-1 relative z-10 overflow-x-auto no-scrollbar w-full min-w-0">
      <div 
        v-for="(item, index) in angle_values" 
        :key="index"
        class="tab-item whitespace-nowrap flex-shrink-0"
        :class="{ 'active': currentTabIndex === index }"
        @click="switchTab(index)"
      >
        <span class="tab-number">{{ index + 1 }}</span>
        <i 
          v-if="angle_values.length > 1 && index !== 0" 
          class="pi pi-times tab-close" 
          @click.stop="removeTab(index)"
        ></i>
      </div>
      <button 
        class="tab-add-btn flex-shrink-0"
        @click="addTab"
        :title="$t('Add New Tab')"
      >
        <i class="pi pi-plus"></i>
      </button>
    </div>
    
    <div class="easyuse-multiangle-content flex flex-col gap-2">
      <!-- 3D Cube Interaction Area -->
      <div 
        class="easyuse-multiangle-cube w-full flex items-center justify-center bg-black overflow-hidden select-none"
        @mousedown="startDrag"
        @touchstart="startDrag"
        @wheel.prevent="handleWheel"
        :class="{'is-hollow': hollow}"
      >
        <div class="settings-icon" @mousedown.stop @click.stop="toggleSettings" :title="$t('Settings')">
            <i class="pi pi-cog"></i>
            <div v-if="showSettings" class="settings-dropdown" @click.stop>
                <div class="settings-item flex items-center">
                    <input type="checkbox" v-model="add_angle_prompt" @change="_=>updateValue(false)" id="add-angle-prompt" />
                    <label for="add-angle-prompt" class="whitespace-nowrap">{{ $t('Angle Prompt') }}</label>
                </div>
                <div class="settings-item flex items-center">
                    <input type="checkbox" v-model="hollow" id="hollow-mode" />
                    <label for="hollow-mode" class="whitespace-nowrap">{{ $t('Hollow') }}</label> 
                </div>
                <div class="settings-item flex items-center">
                    <input type="checkbox" v-model="invert_rotate" id="rotate-3d-mode" />
                    <label for="rotate-3d-mode" class="whitespace-nowrap">{{ $t('Invert Rotate Mode') }}</label> 
                </div>
            </div>
        </div>
        <div class="reset-icon" @mousedown.stop @click.stop="resetValue" :title="$t('Reset')">
            <i class="pi pi-refresh"></i>
        </div>
        <div 
          class="relative transition-transform duration-75 ease-out"
          style="transform-style: preserve-3d; width: 80px; height: 80px;"
          :style="cubeStyle"
        >
          <!-- Faces -->
          <div v-for="face in faces" :key="face.name"
              class="absolute flex items-center justify-center font-bold text-xs easyuse-multiangle-cube-face"
              style="width: 80px; height: 80px; backface-visibility: visible;"
              :style="face.style"
              @dblclick.stop="handleDblClick(face.name)"
          >
            <template v-if="face.name === 'center'">
              <div v-if="hollow">
                <div style="font-size:20px;text-align:center;">🤓</div>
                <div style="font-size:12px;text-align:center;margin-top:-6px">👕</div>
                <div style="font-size:12px;text-align:center;margin-top:-6px">👖</div>
              </div>
            </template>
            <template v-else-if="face.name === 'center-back'">
              <div v-if="hollow" style="filter:grayscale(10)">
                <div style="font-size:20px;text-align:center;">🌕</div>
                <div style="font-size:12px;text-align:center;margin-top:-6px">👕</div>
                <div style="font-size:12px;text-align:center;margin-top:-6px">👖</div>
              </div>
            </template>
            <template v-else>
                <div v-if="face.name === 'front' && !hollow" class="absolute inset-0 flex flex-col items-center justify-center" style="pointer-events:none;">
                    <div style="font-size:20px;text-align:center;">🤓</div>
                    <div style="font-size:12px;text-align:center;margin-top:-6px">👕</div>
                    <div style="font-size:12px;text-align:center;margin-top:-6px">👖</div>
                </div>
                <div v-if="face.text" class="easyuse-cube-face-label">
                    {{ face.text }} 
                </div>
            </template>
          </div>
        </div>
        
      </div>

      <!-- Sliders -->
      <div class="flex flex-col gap-2 px-2 w-full easyuse-mulitangle-slider">
          <!-- Rotate -->
          <div class="flex flex-col gap-2 w-full">
              <div class="flex justify-between items-center">
                  <span class="font-semibold opacity-80">{{ $t('Rotate') }}</span>
                  <span class="font-mono text-primary font-bold">{{ rotate }}°</span>
              </div>
              <Slider v-model="rotate" :min="0" :max="360" class="w-full" @update:modelValue="updateValue" />
          </div>

          <!-- Vertical -->
          <div class="flex flex-col gap-2 w-full">
              <div class="flex justify-between items-center">
                  <span class="font-semibold opacity-80">{{ $t('Vertical') }}</span>
                  <span class="font-mono text-primary font-bold">{{ vertical }}°</span>
              </div>
              <Slider v-model="vertical" :min="-90" :max="90" class="w-full" @update:modelValue="updateValue" />
          </div>

          <!-- Zoom -->
          <div class="flex flex-col gap-2 w-full">
              <div class="flex justify-between items-center">
                  <span class="font-semibold opacity-80">{{ $t('Zoom') }}</span>
                  <span class="font-mono text-primary font-bold">{{ zoom }}</span>
              </div>
              <Slider v-model="zoom" :min="0" :max="10" :step="0.1" class="w-full" @update:modelValue="updateValue" />
          </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount,defineEmits,defineModel } from 'vue';
import { $t } from "@/composable/i18n.js";
import Slider from 'primevue/slider';
import { getSetting, setSetting } from '@/composable/settings';


const emit = defineEmits(['update:value', 'change']);
const {widget} = defineProps(['widget']);
const angle_values = ref([{rotate: 0, vertical: 0, zoom: 5, add_angle_prompt: false }]);
// 当前活动标签索引
const currentTabIndex = ref(0);

// 从当前标签初始化值
const initialValue = angle_values.value[currentTabIndex.value] || { rotate: 0, vertical: 0, zoom: 5, add_angle_prompt: false };
const rotate = ref(initialValue.rotate ?? 0);
const vertical = ref(initialValue.vertical ?? 0);
const zoom = ref(initialValue.zoom ?? 5);
const add_angle_prompt = ref(initialValue.add_angle_prompt ?? false);
const hollow = ref(getSetting('EasyUse.MultiAngle.HollowMode') || false);
const invert_rotate = ref(getSetting('EasyUse.MultiAngle.3DRotate') || false);
const showSettings = ref(false);

const toggleSettings = () => {
    showSettings.value = !showSettings.value;
}

const closeSettings = () => {
    if (showSettings.value) showSettings.value = false;
};

onMounted(() => {
    window.addEventListener('click', closeSettings);
});

onBeforeUnmount(() => {
    window.removeEventListener('click', closeSettings);
    stopDrag(); 
});

watch(_=> widget.value, (newValue) => {
    if (Array.isArray(newValue)) {
        angle_values.value = newValue;
    } else {
        angle_values.value = JSON.parse(newValue)
    }
}, { immediate: true });
watch(() => angle_values.value?.[currentTabIndex.value], (newVal) => {
    if (newVal) {
        let _add_angle_prompt = getSetting('EasyUse.MultiAngle.AddAnglePrompt') ?? false;
        if (newVal.rotate !== undefined) rotate.value = newVal.rotate;
        if (newVal.vertical !== undefined) vertical.value = newVal.vertical;
        if (newVal.zoom !== undefined) zoom.value = newVal.zoom;
        if (add_angle_prompt != undefined) add_angle_prompt.value = _add_angle_prompt;
    }
}, { deep: true });
watch(hollow, (newVal) => {
    setSetting('EasyUse.MultiAngle.HollowMode', newVal);
});
watch(invert_rotate, (newVal) => {
    setSetting('EasyUse.MultiAngle.InvertRotate', newVal);
});
watch(add_angle_prompt, (newVal) => {
    setSetting('EasyUse.MultiAngle.AddAnglePrompt', newVal);
    angle_values.value.forEach((item) => {
        item.add_angle_prompt = newVal;
    });
});

// 切换标签
const switchTab = (index) => {
    currentTabIndex.value = index;
    const tabValue = angle_values.value[index];
    if (tabValue) {
        rotate.value = tabValue.rotate ?? 0;
        vertical.value = tabValue.vertical ?? 0;
        zoom.value = tabValue.zoom ?? 5;
        add_angle_prompt.value = tabValue.add_angle_prompt ?? true;
    }
};

// 添加新标签
const addTab = () => {
    // 复制当前标签的参数
    const currentTab = angle_values.value[currentTabIndex.value];
    const newTab = { 
        rotate: rotate.value, 
        vertical: vertical.value, 
        zoom: zoom.value, 
        add_angle_prompt: add_angle_prompt.value 
    };
    angle_values.value.push(JSON.parse(JSON.stringify(newTab))); // 深拷贝
    currentTabIndex.value = angle_values.value.length - 1;
    switchTab(currentTabIndex.value);
};

// 删除标签
const removeTab = (index) => {
    if (angle_values.value.length <= 1) return;
    angle_values.value.splice(index, 1);
    if (currentTabIndex.value >= angle_values.value.length) {
        currentTabIndex.value = angle_values.value.length - 1;
    }
    switchTab(currentTabIndex.value);
};

const updateValue = (closeSettings = false) => {
    if(closeSettings) showSettings.value = false;
    const newValue = { 
        rotate: rotate.value, 
        vertical: vertical.value, 
        zoom: zoom.value,
        add_angle_prompt: add_angle_prompt.value,
    };
    
    // 深拷贝并更新当前标签
    if (!Array.isArray(angle_values.value)) {
        angle_values.value = [];
    }
    angle_values.value[currentTabIndex.value] = JSON.parse(JSON.stringify(newValue));
};

const resetValue = () => {
    rotate.value = 0;
    vertical.value = 0;
    zoom.value = 5;
    updateValue();
};

const handleDblClick = (name) => {
    switch (name) {
        case 'front':
            rotate.value = 0;
            break;
        case 'back':
            rotate.value = 180;
            break;
        case 'left':
            rotate.value = 270;
            break;
        case 'right':
            rotate.value = 90;
            break;
        case 'up':
            vertical.value = 90;
            break;
        case 'down':
            vertical.value = -90;
            break;
    }
    updateValue();
};

// Faces definition
const faces = computed(() => [
    { name: 'front', text: '', style: { transform: 'translateZ(40px)' } },
    { name: 'back', text: $t('B'), style: { transform: 'rotateY(180deg) translateZ(40px)' } },
    { name: 'up', text: $t('U'), style: { transform: 'rotateX(90deg) translateZ(40px)' } },
    { name: 'down', text: $t('D'), style: { transform: 'rotateX(-90deg) translateZ(40px)' } },
    { name: 'left', text: $t('L'), style: { transform: 'rotateY(-90deg) translateZ(40px)' } },
    { name: 'right', text: $t('R'), style: { transform: 'rotateY(90deg) translateZ(40px)' } },
    { name: 'center', style: { transform: 'translateZ(0.1px)', border: 'none', background:'transparent', backfaceVisibility: 'hidden' } },
    { name: 'center-back', style: { transform: 'rotateY(180deg) translateZ(0.1px)', border: 'none', backfaceVisibility: 'hidden', background:'transparent' } },
]);

// Dragging Logic
const isDragging = ref(false);
const startPos = { x: 0, y: 0 };
const startVals = { rotate: 0, vertical: 0 };

const handleWheel = (e) => {
    const delta = e.deltaY;
    const sensitivity = 0.05;
    let newZoom = zoom.value - delta * sensitivity;
    newZoom = Math.max(0, Math.min(10, newZoom));
    zoom.value = Math.round(newZoom * 10) / 10;
    updateValue();
};

const startDrag = (e) => {
    isDragging.value = true;
    startPos.x = e.clientX ?? e.touches[0].clientX;
    startPos.y = e.clientY ?? e.touches[0].clientY;
    startVals.rotate = rotate.value;
    startVals.vertical = vertical.value;

    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onDrag);
    window.addEventListener('touchend', stopDrag);
};

const onDrag = (e) => {
    if (!isDragging.value) return;
    const clientX = e.clientX ?? e.touches[0].clientX;
    const clientY = e.clientY ?? e.touches[0].clientY;
    
    // Calculate deltas
    let deltaX = clientX - startPos.x;
    let deltaY = clientY - startPos.y;
    
    // Reverse direction for 3D software style
    if (invert_rotate.value) {
        deltaX = -deltaX;
        deltaY = -deltaY;
    }

    // Adjust sensitivity
    const sensitivity = 0.5;
    let newRotate = startVals.rotate + deltaX * sensitivity;
    let newVertical = startVals.vertical + deltaY * sensitivity;

    // Normalize and Clamp
    newRotate = ((newRotate % 360) + 360) % 360; 
    newVertical = Math.max(-90, Math.min(90, newVertical));

    rotate.value = Math.round(newRotate);
    vertical.value = Math.round(newVertical);
    updateValue();
};

const stopDrag = () => {
    isDragging.value = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchmove', onDrag);
    window.removeEventListener('touchend', stopDrag);
};


const cubeStyle = computed(() => {
    return {
        transform: `scale(${1 + zoom.value * 0.1}) rotateX(${-vertical.value}deg) rotateY(${-rotate.value}deg)`
    };
});

onMounted(_=> {  
    hollow.value = getSetting('EasyUse.MultiAngle.HollowMode');  
    invert_rotate.value = getSetting('EasyUse.MultiAngle.InvertRotate');  
    add_angle_prompt.value = getSetting('EasyUse.MultiAngle.AddAnglePrompt') || false;

    widget.serializeValue = async({node}, index) => {
      try {
        let value = JSON.stringify(angle_values.value)
        if(node?.widgets_values){
          node.widgets_values[index] = value
          node.widgets[index].value  = value
        }
        return value
      } catch (error) {
        console.error('Vue Component: Error in serializeValue:', error)
        return []
      }
    }
})
</script>

<style>

.easyuse-multiangle-widget {
    font-size: 12px;
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
}

/* 标签页样式 */
.easyuse-multiangle-tabs{
    overflow-y: auto;
    margin-bottom: -1px;
}
.tab-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-radius: 6px 6px 0 0;
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 11px;
    color: var(--p-text-muted-color);
    margin-bottom: -1px;
}

.tab-item:hover {
    color: var(--p-primary-color);
    /* background: var(--p-surface-100); */
}

.tab-item.active {
    background: #000;
    color: var(--p-primary-color);
    border: 1px solid var(--p-content-border-color);
    border-bottom-color: #000;
    z-index: 2;
    font-weight: 600;
}

.tab-number {
    font-weight: inherit;
    font-size: 11px;
}

.easyuse-multiangle-content {
    border: 1px solid var(--p-content-border-color);
    background: var(--p-content-background);
    border-radius:0 6px 6px 6px;
    border-top-left-radius: 0;
    overflow: hidden;
}

.tab-close {
    font-size: 10px;
    opacity: 0.7;
    transition: opacity 0.2s;
}

.tab-close:hover {
    opacity: 1;
}

.tab-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--p-text-secondary-color);
}

.tab-add-btn:hover {
    border-color: var(--p-primary-color);
    color: var(--p-primary-color);
    background:transparent;
}

.tab-add-btn i {
    font-size: 10px;
}

.easyuse-multiangle-widget {
    font-size: 12px;
    --p-slider-handle-width: 16px;
    --p-slider-handle-height: 16px;
    --p-slider-handle-border-radius: 50%;
    --p-slider-handle-background: var(--p-content-border-color);
    --p-slider-handle-hover-background: var(--p-content-border-color);
    --p-slider-handle-focus-ring-width: var(--p-focus-ring-width);
    --p-slider-handle-focus-ring-style: var(--p-focus-ring-style);
    --p-slider-handle-focus-ring-color: var(--p-focus-ring-color);
    --p-slider-handle-focus-ring-offset: var(--p-focus-ring-offset);
    --p-slider-handle-focus-ring-shadow: var(--p-focus-ring-shadow);
    --p-slider-handle-content-border-radius: 50%;
    --p-slider-handle-content-hover-background: var(--p-content-background);
    --p-slider-handle-content-width: 8px;
    --p-slider-handle-content-height: 8px;
    --p-slider-handle-content-shadow: 0px 0.5px 0px 0px rgba(0, 0, 0, 0.08), 0px 1px 1px 0px rgba(0, 0, 0, 0.14);
    --p-slider-range-background: var(--p-primary-color);
    --p-slider-track-background: var(--p-content-border-color);
    --p-slider-track-border-radius: var(--p-content-border-radius);
    --p-slider-track-size: 3px;
    --p-slider-transition-duration: var(--p-transition-duration);
    --p-slider-handle-content-background: var(--p-surface-0);
}
.easyuse-multiangle-cube-face{
    border: 4px solid var(--p-content-border-color);
    color: var(--p-text-muted-color);
    background:rgba(from var(--p-content-color) r g b / 0.1)
}
.easyuse-multiangle-cube-face:hover {
    border-color: var(--p-primary-color);
    box-shadow: 0 0 10px var(--p-primary-color);
}
.easyuse-multiangle-cube{
    position: relative;
    overflow: hidden;
    cursor: grab;
    perspective: 800px; 
    height:200px;
    border-radius:0 4px 8px 8px;
}
.easyuse-multiangle-cube:active {
    cursor: grabbing;
}
.easyuse-multiangle-cube .settings-icon {
    position: absolute;
    top: 6px;
    left: 6px;
    color: #ddd;
    cursor: pointer;
    z-index: 20;
}
.easyuse-multiangle-cube .settings-icon i {
    font-size: 12px;
}
.easyuse-multiangle-cube .settings-icon:hover {
    color: var(--p-primary-color);
}
.easyuse-multiangle-cube .settings-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    background: var(--p-content-background);
    border: 1px solid var(--p-content-border-color);
    border-radius: 4px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 100px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}
.settings-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: var(--p-text-color);
}
.settings-item label {
    cursor: pointer;
}
.easyuse-multiangle-cube:not(.is-hollow) .easyuse-multiangle-cube-face {
   background: var(--p-content-background);
}
.easyuse-cube-face-label {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.9);
    pointer-events: none;
    line-height: 1;
}
.easyuse-multiangle-cube .reset-icon{
    position: absolute;
    top:6px;
    right:6px;
    color: #ddd;
    cursor: pointer;
}
.easyuse-multiangle-cube .reset-icon i{
    font-size: 12px!important;
} 
.easyuse-multiangle-cube .reset-icon:hover {
    color: var(--p-primary-color);
}
.easyuse-mulitangle-slider{
    font-size: 10px;
    padding-bottom:14px;
}
.no-scrollbar::-webkit-scrollbar {
    display: none;
}
.no-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
</style>