<template>
<div class="no-result-placeholder">
  <Card >
    <template #content>
      <div class="no-result-placeholder-content">
        <i :class="icon" :style="{'font-size': iconSize,'margin-bottom': '.5rem'}"></i>
        <h3>{{ title }}</h3>
        <p v-if="message">{{ message }}</p>
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
import {defineEmits, defineComponent} from 'vue'

defineComponent({name: 'NoResultsPlaceholder'})
defineProps({
  icon:{
    type: String,
    default: '',
    required: false,
  },
  iconSize:{
    type: String,
    default: '3rem',
    required: false,
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: false
  },
  buttonLabel: {
    type: String,
    default: '',
    required: false,
  }
})
defineEmits(['action'])
</script>