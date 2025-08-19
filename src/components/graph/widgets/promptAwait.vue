<template>
  <div class="w-full flex justify-between items-center">
    <div class="flex justify-start items-center flex-1 gap-2">
      <Button :disabled="!Boolean(isAwait)" :label="$t('Continue')" size="small" style="height:20px;font-size:12px;white-space: nowrap;padding: 0 8px;" @click="send_message(1)"/>
      <Button :disabled="!Boolean(isAwait)" :label="$t('Stop')" severity="danger" size="small" style="height:20px;font-size:12px;white-space: nowrap;padding: 0 8px;" @click="send_message(-1)"/>
      <Select class="easyuse-prompt-await-select" v-model="widget.value.select" :options="[{name:$t('now'),value:'now'},{name:$t('prev'),value:'prev'}]" optionLabel="name" optionValue="value" size="small" style="flex:1;height:24px;line-height:10px;min-width:70px;max-width:100px"></Select>
    </div>
    <div class="flex justify-end items-center tool ml-2 position-relative">
      <Button style="--p-button-sm-font-size:11px" size="small" :icon="widget.value.unlock ? 'pi pi-unlock' : 'pi pi-lock'" :severity="widget.value.unlock ? 'contrast' : 'warn'"  variant="text"  @click="widget.value.unlock  = !widget.value.unlock " rounded v-tooltip:top="{ value: widget.value.unlock ? '随机种子' : '锁定种子值', class:'jm-tooltip' }" />
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
import {MAX_SEED_NUM} from "@/constants/index.js";

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
    updateNestedValue('last_seed', widget.value.value?.seed || 0);
    if(widget.value.value?.unlock){
      updateNestedValue('seed', Math.floor(Math.random() * MAX_SEED_NUM))
    }else{
      updateNestedValue('seed', widget.value.value?.last_seed || 0);
    }
  });
  const original_api_interrupt = api.interrupt;
  api.interrupt = function () {
    if(isAwait.value || !app.runningNodeId) {
      send_message( JSON.stringify({result:-1, prompt:'', select:'now'}), true);
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
  let last_seed = widget.value.value?.last_seed || 0;
  let seed = widget.value.value?.seed || 0;
  let unlock = widget.value.value?.unlock || false;
  body.append('message', JSON.stringify({result:value, prompt, select, last_seed, seed, unlock}));
  body.append('id', node_id);
  isAwait.value = false;
  api.fetchApi("/easyuse/message_callback", { method: "POST", body, }).then(_=>{
    updateNestedValue('select', 'now');
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
<style>
.easyuse-prompt-await-select .p-select-label{
  font-size: 12px!important;
}
.easyuse-prompt-await-select .p-select-dropdown{
  width:1.5rem!important;
}
.easyuse-prompt-await-select .p-select-dropdown svg{
  width:12px!important;
  height: 12px!important;
}
</style>
