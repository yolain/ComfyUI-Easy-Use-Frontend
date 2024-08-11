import '@/extensions'
import {createApp} from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import PrimeVue from "primevue/config";

const graph_canvas = document.getElementsByClassName('graph-canvas-container')?.[0]
const easyuse = document.createElement('div')
easyuse.id = 'comfyui-easyuse-components'
graph_canvas ? graph_canvas.append(easyuse) : document.body.append(easyuse)

const app = createApp(App)

app.use(PrimeVue);
app.use(createPinia())
app.mount('#'+easyuse.id)
