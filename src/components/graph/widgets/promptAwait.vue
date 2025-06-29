<template>
  <div class="w-full flex justify-between items-center">
    <div class="flex justify-start items-center flex-1 gap-2">
      <Button :disabled="!Boolean(isAwait)" :label="$t('Continue')" size="small" style="height:20px" @click="send_message(1)"/>
      <Button :disabled="!Boolean(isAwait)" :label="$t('Stop')" severity="danger" size="small" style="height:20px" @click="send_message(-1)"/>
      <Select v-model="widget.value.select" :options="['new','prev']" size="small" style="height:24px;line-height:10px;width:90px"></Select>
    </div>
    <div class="flex justify-end items-center tool ml-2 position-relative">
      <Button v-if="isRecording" size="small" icon="pi pi-pause-circle" severity="info"  variant="outlined"  @click="stopRecord" rounded v-tooltip:top="{ value: $t('Stop Recording'), class:'jm-tooltip' }" />
      <Button v-else size="small" icon="pi pi-microphone" severity="contrast" variant="text" @click="startRecord" rounded v-tooltip:top="{ value: $t('Voice input'), class:'jm-tooltip' }" />
    </div>
  </div>
</template>


<script setup>
import {api, app} from "@/composable/comfyAPI.js";
import {ref, watch, onMounted, computed, nextTick} from 'vue'
import { $t } from '@/composable/i18n.js'
import { getWidgetByName } from '@/composable/node.js'
import Button from 'primevue/button'
import Select from 'primevue/select';
import vTooltip from 'primevue/tooltip';

const widget = defineModel('widget', {
  required: true
})
const isAwait = ref(false)
const isRecording = ref(false)
let recognition = null
const startRecord = () => {
  if(isRecording.value) return
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('The voice recognition function does not support the current browser.')
    // $error('提示', '你的浏览器不支持语音识别功能。')
  } else {
    isRecording.value = true
    if(!recognition) {
      recognition = new SpeechRecognition();
      recognition.interimResults = false;
    }
    recognition.start();
    recognition.addEventListener('result', (event) => {
      const transcript = event.results[0][0].transcript;
      let node = widget.value?.node
      let textarea = getWidgetByName(node, 'prompt')
      if(textarea){
        textarea.value += transcript
      }
    });

    recognition.addEventListener('end', () => {
      isRecording.value = false
      recognition = null
    });

    recognition.addEventListener('error', (event) => {
      console.error(event.error);
      // $error('提示', `识别出错：${event.error}`) ;
    });
  }
}
const stopRecord = () => {
  if(!isRecording.value) return
  if(recognition) recognition.stop()
}

onMounted(_=>{
  api.addEventListener("easyuse_prompt_await", e =>{
    const current_id = e.detail.id;
    const node_id = (widget.value?.node.id).toString().indexOf(':')!== -1 ? (widget.value?.node.id).toString().split(':')[0] : widget.value?.node.id;
    if(parseInt(current_id) !== parseInt(node_id)) return;
    isAwait.value = true
  });
  const original_api_interrupt = api.interrupt;
  api.interrupt = function () {
    if(isAwait.value || !app.runningNodeId) {
      send_message( JSON.stringify({result:-1, prompt:'', select:'new'}), true);
      isAwait.value = false;
    }
    original_api_interrupt.apply(this, arguments);
  }
})
// 发送信息
const send_message = (value, force) => {
  if(!isAwait.value && !force) return;
  const body = new FormData();
  const node = widget.value?.node;
  const node_id = (widget.value?.node.id).toString().indexOf(':')!== -1 ? (widget.value?.node.id).toString().split(':')[0] : widget.value?.node.id;
  const prompt = getWidgetByName(node, 'prompt')?.value || '';
  let select = widget.value.value?.select;
  body.append('message', JSON.stringify({result:value, prompt, select}));
  body.append('id', node_id);
  isAwait.value = false;
  api.fetchApi("/easyuse/message_callback", { method: "POST", body, }).then(_=>{
    updateNestedValue('select', 'new');
  })
}

// 修改嵌套属性的示例
const updateNestedValue = (key, value) => {
  if (!widget.value.value) {
    widget.value.value = {};
  }
  widget.value.value[key] = value;
}
</script>
