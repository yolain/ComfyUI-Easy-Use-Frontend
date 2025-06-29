<template>
  <div class="w-full flex justify-between items-center">
    <div class="flex justify-start items-center flex-1 gap-2">
      <Button :disabled="!Boolean(isAwait)" :label="$t('Continue')" size="small" style="height:20px" @click="send_message(1)"/>
      <Button :disabled="!Boolean(isAwait)" :label="$t('Stop')" severity="danger" size="small" style="height:20px" @click="send_message(-1)"/>
    </div>
    <div class="flex justify-end items-center tool ml-2 position-relative">
      <Button v-if="isRecording" size="small" icon="pi pi-pause-circle" severity="info"  variant="outlined"  @click="stopRecord" rounded v-tooltip:top="{ value: $t('Stop Recording'), class:'jm-tooltip' }" />
      <Button v-else size="small" icon="pi pi-microphone" severity="contrast" variant="text" @click="startRecord" rounded v-tooltip:top="{ value: $t('Voice input'), class:'jm-tooltip' }" />
    </div>
  </div>
</template>


<script setup>
import {api, app} from "@/composable/comfyAPI.js";
import {ref, watch, onMounted, computed} from 'vue'
import { $t } from '@/composable/i18n.js'
import { getWidgetByName } from '@/composable/node.js'
import Button from 'primevue/button'
import vTooltip from 'primevue/tooltip';

const props = defineProps(['widget'])


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
      let node = props.widget?.node
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
    if(parseInt(e.detail.id) !== props.widget.node.id) return;
    isAwait.value = true
  });
  const original_api_interrupt = api.interrupt;
  api.interrupt = function () {
    if(isAwait.value || !app.runningNodeId) {
      send_message( JSON.stringify({result:-1}), true);
      isAwait.value = false;
    }
    original_api_interrupt.apply(this, arguments);
  }
})
// 发送信息
const send_message = (value, force) => {
  if(!isAwait.value && !force) return;
  const body = new FormData();
  const node = props.widget.node;
  const prompt = getWidgetByName(node, 'prompt')?.value || '';
  body.append('message', JSON.stringify({result:value, prompt}));
  body.append('id', props.widget.node.id);
  isAwait.value = false;
  api.fetchApi("/easyuse/message_callback", { method: "POST", body, });
}
</script>

