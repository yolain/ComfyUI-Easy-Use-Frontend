<template>
<div class="easyuse-styles-selector">
    <div class="easyuse-styles-selector-header flex justify-between gap-2">
        <div class="flex align-center gap-1">
            <Button icon="pi pi-trash" severity="secondary" outlined size="small" v-tooltip="$t('Reset')" @click="clearSelectedStyles" />
            <!-- <Button icon="pi pi-cog" severity="secondary" outlined size="small" v-tooltip="$t('Manage')" /> -->
        </div>
        <div class="flex-1">
            <IconField>
                <InputIcon class="pi pi-search" />
                <InputText 
                    v-model="searchText" 
                    :placeholder="$t('Search styles...')" 
                    class="w-full"
                />
            </IconField>
        </div>
        <SelectButton
          v-model="layout"
          :options="['Gird', 'List']"
          :allow-empty="false"
        >
          <template #option="{ option }">
            <i :class="[option === 'List' ? 'pi pi-bars' : 'pi pi-table']" />
          </template>
        </SelectButton>
    </div>
    <div class="easyuse-styles-selector-content" @mouseleave="e=>sortStyles(widget.node.name)">
        <!-- 网格布局 -->
        <div v-if="layout === 'Gird'" class="grid-container gap-2">
          <SelectorCard 
            v-for="(item, index) in filteredStyles" 
            :key="`${item.name}-${index}`"
            :item="item"
            unique-key="name"
            :locale="locale"
            :selectable="true"
            :is-selected="isItemSelected(item)"
            :show-description="true"
            :preview-enabled="true"
            @select="onStyleSelect"
            @item-hover="displayImage"
            @item-leave="hiddenImage"
          />
        </div>
        
        <!-- 列表布局 -->
        <div v-else class="list-container">
          <SelectorList 
            v-for="(item, index) in filteredStyles" 
            :key="`${item.name}-${index}`"
            :item="item"
            unique-key="name"
            :locale="locale"
            :selectable="true"
            :is-selected="isItemSelected(item)"
            :show-description="true"
            @select="onStyleSelect"
            @item-hover="displayImage"
            @item-leave="hiddenImage"
          />
        </div>
    </div>    
    <div class="easyuse-styles-selector-previewer" v-if="preview?.positive || preview?.negative">
      <div class="easyuse-styles-selector-previewer__text">
        <img :src="preview.src" alt="" style="width: 100%; height: auto; object-fit: contain;border-radius: 6px;" />
        <span class="title">{{ preview.name }}</span>
        <div class="easyuse-styles-selector-previewer__prompt">
          <h6 v-if="preview.positive">
            <span class="comfyui-easyuse-success">{{ $t('Positive') }}:</span>
            <span>{{ preview.positive }}</span>
          </h6>
          <h6 v-if="preview.negative">
            <span class="comfyui-easyuse-error">{{ $t('Negative') }}:</span>
            <span>{{ preview.negative }}</span>
          </h6>
        </div>
      </div>
    </div>
</div>
</template>

<script setup>
import vTooltip from "primevue/tooltip";
import { SelectButton, Button, InputText, IconField, InputIcon } from "primevue";
import SelectorCard from "@/components/graph/selector/selectorCard.vue";
import SelectorList from "@/components/graph/selector/selectorList.vue";
import { api } from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n.js";
import {computed, onMounted, watch, ref, reactive} from "vue";
import {getWidgetByName} from "@/composable/node.js";
import {getSetting, setSetting} from "@/composable/settings.js";
import {toast} from "@/components/toast.js";

import {storeToRefs} from "pinia";
import {useGraphStore} from "@/stores/graph.js";
import cloneDeep from "lodash/cloneDeep";
const store = useGraphStore()
const {selectors_styles} = storeToRefs(store)

const selectedStyle = ref('')
const selectedItems = defineModel({ required: true })
const { widget } = defineProps(['widget'])
const inputSpec = widget.inputSpec

const locale = computed(_=> getSetting('Comfy.Locale') || 'en')

const layout = ref(getSetting('EasyUse.StylesSelector.DisplayType') || 'Gird')
const styles = ref([])
const searchText = ref('')

watch(_=> layout.value, (newLayout) => {
  setSetting('EasyUse.StylesSelector.DisplayType', newLayout)
})

// 计算过滤后的样式列表
const filteredStyles = computed(() => {
  if (!searchText.value.trim()) {
    return styles.value
  }
  const selectedStyles = selectedItems.value || []
  const searchLower = searchText.value.toLowerCase()
  // 分离已选中和未选中的样式
  const selected = []
  const unselected = []
  styles.value.forEach(style => {
    if (selectedStyles.includes(style.name)) {
      selected.push(style)
    } else {
      // 对未选中的样式进行搜索过滤
      const name = locale.value === 'zh' && style.name_cn ? style.name_cn : style.name
      const prompt = style.prompt || ''
      const negative = style.negative_prompt || ''
      
      if (name.toLowerCase().includes(searchLower) || 
          prompt.toLowerCase().includes(searchLower) || 
          negative.toLowerCase().includes(searchLower)) {
        unselected.push(style)
      }
    }
  })
  // 返回已选中的样式在前，过滤后的未选中样式在后
  return [...selected, ...unselected]
})

// 预览相关数据
const preview = reactive({
  name: '',
  positive: '',
  negative: '',
  src: ''
})

const getStylesList = async(name) =>{
  if(selectors_styles.value[name]) return true
  const resp = await api.fetchApi(`/easyuse/prompt/styles?name=${name}`);
  if (resp.status === 200) {
    let data = await resp.json();
    let _styles = data.map((i,index)=> {i.index = index;return i})
    await store.setStyles(name, _styles)
    return true
  }else {
    toast.error($t('Get styles list Failed'))
    return false
  }
}

// 显示预览
const displayImage = (item) =>{
  preview.name = locale.value == 'zh' && item.name_cn ? item.name_cn : item.name
  preview.src = (!item.thumbnailVariant || item.thumbnailVariant== 'default') ? item.thumbnail : (item.thumbnail?.[1] || item.thumbnail?.[0])
  preview.positive = item.prompt
  preview.negative = item.negative_prompt
}

// 隐藏预览
const hiddenImage = () => {
  preview.name = ''
  preview.src = ''
  preview.positive = ''
  preview.negative = ''
}

const sortStyles = _ =>{
  const selectedStyles = selectedItems.value || []
  const select = cloneDeep(selectors_styles.value[selectedStyle.value])
  // 确保重新创建数组以触发Vue的响应式更新
  styles.value = [...select.sort((a,b)=> a.index - b.index).sort((a,b) => selectedStyles.includes(b.name) - selectedStyles.includes(a.name))]
}

// 判断项目是否被选中
const isItemSelected = (item) => {
  const selectedStyles = selectedItems.value || []
  return selectedStyles.includes(item.name)
}

// 处理单个样式选择
const onStyleSelect = (item) => {
  console.log('Selected style item:', item)
  
  let newSelection = [...(selectedItems.value || [])]
  const itemKey = item.name
  
  // 多选模式
  const index = newSelection.findIndex(selected => selected === itemKey)
  
  if (index > -1) {
    newSelection.splice(index, 1) // 取消选择
  } else {
    newSelection.push(itemKey) // 添加选择
  }
  
  selectedItems.value = newSelection
  console.log('Updated selection:', newSelection)
}

// 处理样式选择（保留兼容性）
const onStylesSelect = (selection) => {
  console.log('Selected styles:', selection)
  selectedItems.value = selection
}

// 清空选中的样式
const clearSelectedStyles = () => {
  selectedItems.value = []
  console.log('Cleared all selected styles')
}

onMounted(_=> {
    const stylesWidget = getWidgetByName(widget.node, 'styles')
    let style = stylesWidget.value
    selectedStyle.value = style
    getStylesList(style).then(success=> success && sortStyles(style))
    stylesWidget.callback = (style) => {
        selectedStyle.value = style
        clearSelectedStyles()
        getStylesList(style).then(success=> success && sortStyles(style))
    }
})
</script>

<style lang="scss">
.easyuse-styles-selector{
  position: relative;
  //padding: 6px 10px;
  height: calc(100% - 10px);
  --p-inputtext-padding-y: 4px;
  --p-form-field-padding-x: 6px;
  --p-button-sm-padding-y: 0px;
  --p-icon-size: 12px;
  --p-button-icon-only-width: 24px;
  --p-button-sm-font-size: 12px;
  --p-togglebutton-content-left: 2px;
  --p-togglebutton-content-top: 2px;
  .p-inputtext{
    font-size: 11px;
  }
  .p-togglebutton{
    padding:0px 6px;
  }

  &-content{
    list-style: none;
    padding: 0;
    margin: 0;
    min-height: 150px;
    height: calc(100% - 12px);
    overflow-y: auto;
    overflow-x: hidden;
    
    /* 网格布局样式 */
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      padding: 4px 0;
      gap: 8px;
    }
    
    /* 列表布局样式 */
    .list-container {
      list-style: none;
      padding: 6px 0px;
      margin: 0;
      display: flex;
      flex-wrap: wrap;
    }
  }

  &-previewer{
    position: absolute;
    top:0;
    left:-150px;
    width:130px;
    padding: 8px;
    z-index:2;
    border-radius: var(--border-radius);
    background: var(--comfy-menu-bg);
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    &__text{
      color:var(--input-text);
      word-wrap: break-word;
      .title{
        line-height: 1;
        font-size: 10px;
      }
      h6{
        line-height: 1;
        font-size: 8px;
        margin: 8px 0;
        white-space: wrap;
        .comfyui-easyuse-success {
          color: #22c55e;
          font-weight: 600;
        }
        
        .comfyui-easyuse-error {
          color: #ef4444;
          font-weight: 600;
        }
        
        span:last-child {
          color: var(--input-text);
          font-weight: normal;
          margin-left: 4px;
        }
      }
    }
  }
}
</style>