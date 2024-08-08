import '@/extensions'
import {createApp} from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const easyuse = document.createElement('div')
easyuse.id = 'comfyui-easyuse-components'
document.body.append(easyuse)

const app = createApp(App)

app.use(createPinia())
app.mount('#'+easyuse.id)
