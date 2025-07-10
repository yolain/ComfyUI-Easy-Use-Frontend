<template>
  <div class="easyuse-multiselect">
    <MultiSelect
      v-model="selectedItems"
      :options="options"
      :optionLabel="optionLabel"
      :optionValue="optionValue"
      appendTo="self"
      filter
      :placeholder="placeholder"
      :max-selected-labels="maxItems"
      :display="display"
      class="w-full easyuse-multiselect-container"
    />
  </div>
</template>

<script setup>
import MultiSelect from 'primevue/multiselect'
import {$t} from "@/composable/i18n.js";
import {computed, onMounted, watch, ref} from "vue";
import {getWidgetByName} from "@/composable/node.js";
import {HUMAN_SEGMENTATION} from "@/constants/index.js";
const human_segmentation = Object.keys(HUMAN_SEGMENTATION).reduce((acc, key) => {
  if (Array.isArray(HUMAN_SEGMENTATION[key])) {
    acc[key] = HUMAN_SEGMENTATION[key].map((item, index) => ({
      label: item,
      value: index
    }));
  } else if (typeof HUMAN_SEGMENTATION[key] === 'object') {
    acc[key] = Object.entries(HUMAN_SEGMENTATION[key]).map(([key, value]) => ({
      label: key,
      value: value
    }));
  } else {
    acc[key] = [];
  }
  return acc;
}, {});

const selectedItems = defineModel({ required: true })
const { widget } = defineProps(['widget'])
const inputSpec = widget.inputSpec
const maxItems = inputSpec.multi_select?.max_selected_labels ?? 3
const optionLabel = inputSpec.optionLabel ?? 'label'
const optionValue = inputSpec.optionValue ?? 'value'
const placeholder = inputSpec.multi_select?.placeholder ? $t(inputSpec.multi_select?.placeholder) : $t('select items')
const display = inputSpec.multi_select?.chip ? 'chip' : 'comma'

const options = ref(inputSpec.options ?? [])

const changeOptions = (method) => {
  if (method && human_segmentation[method]) {
    options.value = human_segmentation[method].map((item, index) => ({
      label: $t(item.label),
      value: item.value
    }));
  } else {
    options.value = [];
  }
};

onMounted(_=>{
  const nodeType = widget.node.type
  if(nodeType == 'easy humanSegmentation'){
    const method_widget = getWidgetByName(widget.node, 'method')
    changeOptions(method_widget.value)
    method_widget.callback = (value) => {
      selectedItems.value = []
      changeOptions(value)
    }
  }
})
</script>

<style>
.easyuse-multiselect {
  font-size: 12px;
  padding: 0 15px;

  --p-chip-remove-icon-size: .75rem;
  --p-chip-remove-icon-focus-ring-width: var(--p-focus-ring-width);
  --p-chip-remove-icon-focus-ring-style: var(--p-focus-ring-style);
  --p-chip-remove-icon-focus-ring-color: var(--p-focus-ring-color);
  --p-chip-remove-icon-focus-ring-offset: var(--p-focus-ring-offset);
  --p-chip-remove-icon-focus-ring-shadow: var(--p-form-field-focus-ring-shadow);
  --p-chip-icon-size: .75rem;
  --p-chip-image-width: 2rem;
  --p-chip-image-height: 2rem;
  --p-chip-border-radius: 16px;
  --p-chip-padding-x: 0.25rem;
  --p-chip-padding-y: 0.5rem;
  --p-chip-gap: 0.25rem;
  --p-chip-transition-duration: var(--p-transition-duration);
  --p-chip-remove-icon-color: var(--input-text);
  --p-chip-icon-color: var(--input-text);
  --p-chip-background: var(--content-bg);
  --p-chip-color: var(--input-text);

  --p-checkbox-icon-size: 0.875rem;
  --p-checkbox-icon-color: var(--p-form-field-color);
  --p-checkbox-icon-checked-color: var(--p-primary-contrast-color);
  --p-checkbox-icon-checked-hover-color: var(--p-primary-contrast-color);
  --p-checkbox-icon-disabled-color: var(--p-form-field-disabled-color);
  --p-checkbox-icon-lg-size: 1rem;
  --p-checkbox-icon-sm-size: 0.75rem;
  --p-checkbox-border-radius: var(--p-border-radius-sm);
  --p-checkbox-width: 1rem;
  --p-checkbox-height: 1rem;
  --p-checkbox-background: var(--p-form-field-background);
  --p-checkbox-checked-background: var(--p-primary-color);
  --p-checkbox-checked-hover-background: var(--p-primary-hover-color);
  --p-checkbox-disabled-background: var(--p-form-field-disabled-background);
  --p-checkbox-filled-background: var(--p-form-field-filled-background);
  --p-checkbox-border-color: var(--p-form-field-border-color);
  --p-checkbox-hover-border-color: var(--p-form-field-hover-border-color);
  --p-checkbox-focus-border-color: var(--p-form-field-border-color);
  --p-checkbox-checked-border-color: var(--p-primary-color);
  --p-checkbox-checked-hover-border-color: var(--p-primary-hover-color);
  --p-checkbox-checked-focus-border-color: var(--p-primary-color);
  --p-checkbox-checked-disabled-border-color: var(--p-form-field-border-color);
  --p-checkbox-invalid-border-color: var(--p-form-field-invalid-border-color);
  --p-checkbox-shadow: var(--p-form-field-shadow);
  --p-checkbox-transition-duration: var(--p-form-field-transition-duration);
  --p-checkbox-lg-width: 1.5rem;
  --p-checkbox-lg-height: 1.5rem;
  --p-checkbox-sm-width: 1rem;
  --p-checkbox-sm-height: 1rem;
  --p-checkbox-focus-ring-width: var(--p-focus-ring-width);
  --p-checkbox-focus-ring-style: var(--p-focus-ring-style);
  --p-checkbox-focus-ring-color: var(--p-focus-ring-color);
  --p-checkbox-focus-ring-offset: var(--p-focus-ring-offset);
  --p-checkbox-focus-ring-shadow: var(--p-focus-ring-shadow);

  --p-multiselect-empty-message-padding: var(--p-list-option-padding);
  --p-multiselect-clear-icon-color: var(--p-form-field-icon-color);
  --p-multiselect-chip-border-radius: var(--p-border-radius-sm);
  --p-multiselect-option-group-background: var(--p-list-option-group-background);
  --p-multiselect-option-group-color: var(--p-list-option-group-color);
  --p-multiselect-option-group-font-weight: var(--p-list-option-group-font-weight);
  --p-multiselect-option-group-padding: var(--p-list-option-group-padding);
  --p-multiselect-option-focus-background: var(--p-list-option-focus-background);
  --p-multiselect-option-selected-background: var(--p-list-option-selected-background);
  --p-multiselect-option-selected-focus-background: var(--p-list-option-selected-focus-background);
  --p-multiselect-option-color: var(--p-list-option-color);
  --p-multiselect-option-focus-color: var(--p-list-option-focus-color);
  --p-multiselect-option-selected-color: var(--p-list-option-selected-color);
  --p-multiselect-option-selected-focus-color: var(--p-list-option-selected-focus-color);
  --p-multiselect-option-padding: 0.25rem;
  --p-multiselect-option-border-radius: var(--p-list-option-border-radius);
  --p-multiselect-option-gap: 0.5rem;
  --p-multiselect-list-padding: var(--p-list-padding);
  --p-multiselect-list-gap: var(--p-list-gap);
  --p-multiselect-list-header-padding: .25rem;
  --p-multiselect-overlay-background: var(--p-overlay-select-background);
  --p-multiselect-overlay-border-color: var(--p-overlay-select-border-color);
  --p-multiselect-overlay-border-radius: var(--p-overlay-select-border-radius);
  --p-multiselect-overlay-color: var(--p-overlay-select-color);
  --p-multiselect-overlay-shadow: var(--p-overlay-select-shadow);
  --p-multiselect-dropdown-width: 1.25rem;
  --p-multiselect-dropdown-color: var(--input-text);
  --p-multiselect-background: var(--comfy-input-bg);
  --p-multiselect-disabled-background: var(--p-form-field-disabled-background);
  --p-multiselect-filled-background: var(--p-form-field-filled-background);
  --p-multiselect-filled-hover-background: var(--p-form-field-filled-hover-background);
  --p-multiselect-filled-focus-background: var(--p-form-field-filled-focus-background);
  --p-multiselect-border-color: var(--border-color);
  --p-multiselect-hover-border-color: var(--border-color);
  --p-multiselect-focus-border-color: var(--border-color);
  --p-multiselect-invalid-border-color: var(--p-form-field-invalid-border-color);
  --p-multiselect-color: var(--p-form-field-color);
  --p-multiselect-disabled-color: var(--p-form-field-disabled-color);
  --p-multiselect-placeholder-color:var(--descrip-text);
  --p-multiselect-invalid-placeholder-color: var(--p-form-field-invalid-placeholder-color);
  --p-multiselect-shadow: var(--p-form-field-shadow);
  --p-multiselect-padding-x: 8px;
  --p-multiselect-padding-y: 2px;
  --p-multiselect-border-radius: 10px;
  --p-multiselect-transition-duration: var(--p-form-field-transition-duration);
  --p-multiselect-lg-font-size: var(--p-form-field-lg-font-size);
  --p-multiselect-lg-padding-x: var(--p-form-field-lg-padding-x);
  --p-multiselect-lg-padding-y: var(--p-form-field-lg-padding-y);
  --p-multiselect-sm-font-size: var(--p-form-field-sm-font-size);
  --p-multiselect-sm-padding-x: var(--p-form-field-sm-padding-x);
  --p-multiselect-sm-padding-y: var(--p-form-field-sm-padding-y);
  --p-multiselect-focus-ring-width: var(--p-form-field-focus-ring-width);
  --p-multiselect-focus-ring-style: var(--p-form-field-focus-ring-style);
  --p-multiselect-focus-ring-color: var(--p-form-field-focus-ring-color);
  --p-multiselect-focus-ring-offset: var(--p-form-field-focus-ring-offset);
  --p-multiselect-focus-ring-shadow: var(--p-form-field-focus-ring-shadow);

  --p-icon-size: .7rem;
  --p-inputtext-padding-y: .15rem;
  --p-inputtext-padding-x: .25rem;
  .p-multiselect-list{
    flex-wrap: wrap;
    flex-direction: row;
  }
}

.comfyui-easyuse .easyuse-multiselect{
  font-size: 11px;
  --p-multiselect-padding-y: 2px;
  padding:0 10px;
  --p-multiselect-border-radius: var(--p-form-field-border-radius);
  --p-multiselect-placeholder-color: #d4d4d8;
  --p-multiselect-dropdown-color: var(--input-text);
  --p-multiselect-border-color: var(--p-form-field-border-color);
  --p-multiselect-hover-border-color: var(--p-form-field-hover-border-color);
  --p-multiselect-focus-border-color: var(--p-form-field-focus-border-color);
}

</style>