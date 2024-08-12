<template>
<div class="no-results-placeholder">
  <Card >
    <template #content>
      <div class="flex flex-column align-items-center">
        <i :class="icon" style="font-size: 3rem; margin-bottom: 1rem"></i>
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <Button
          v-if="buttonLabel"
          :label="buttonLabel"
          @click="$emit('action')"
          class="p-button-text"
        />
      </div>
    </template>
  </Card>
</div>
</template>

<script setup>
import Card from 'primevue/card'
import Button from 'primevue/button'
import {defineProps, defineEmits, defineComponent} from 'vue'

defineComponent({name: 'NoResultsPlaceholder'})
defineProps({
  icon:{
    type: String,
    default: '',
    required: false,

  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  buttonLabel: {
    type: String,
    default: '',
    required: false,

  }
})

defineEmits(['action'])
</script>

<style scoped>
.no-results-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.no-results-placeholder :deep(.p-card) {
  background-color: transparent;
  text-align: center;
}

.no-results-placeholder h3 {
  color: var(--input-text);
  margin-bottom: 0.5rem;
}

.no-results-placeholder p {
  color: var(--descrip-text);
  margin-bottom: 1rem;
}
</style>