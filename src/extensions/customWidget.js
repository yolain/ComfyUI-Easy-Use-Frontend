import {createApp} from 'vue'
import PrimeVue from "primevue/config";
import { app, $el } from '@/composable/comfyAPI.js'
import {ref} from "vue";
import {useChainCallback} from "@/composable/utils/useChainCallback.js";
import {useDomWidgetStore} from "@/stores/domWidgetStore.js";

import {ComponentWidgetImpl} from "@/composable/widgets/domWidget.js";
import promptAwaitBar from "@/components/graph/widgets/promptAwait.vue";
import multiSelectWidget from "@/components/graph/widgets/multiSelectWidget.vue";
import multiAngleWidget from '@/components/graph/widgets/multiAngleWidget.vue';
import stylesSelector from '@/components/graph/widgets/stylesSelector.vue';
import {getSetting} from "@/composable/settings.js";

const vueApps = new Map()
const defaultStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
}
const createVueWidget = (obj, components) => {
  const container = document.createElement('div')
  const node = obj.node
  const options = obj.options || {getMinHeight: () => 100, hideOnZoom: true, serialize: true}
  const styles = obj.styles || null
  container.id = `easyuse-vue-widget-${node.id}`
  Object.assign(container.style, defaultStyle, styles || {})

  const widget = node.addDOMWidget(
    obj.name || 'ustom_vue_component_basic',
    'vue-basic',
    container,
    options,
  )
  if(obj.inputSpec) widget.inputSpec = obj.inputSpec
  const vueApp = createApp(components, {
    widget,
    node
  })
  vueApp.use(PrimeVue)
  vueApp.mount(container)
  vueApps.set(node.id, vueApp)

  widget.onRemove = () => {
    const vueApp = vueApps.get(node.id)
    if (vueApp) {
      vueApp.unmount()
      vueApps.delete(node.id)
    }
  }

  return { widget }
}

app.registerExtension({
    name: 'Comfy.EasyUse.CustomWidget',
    getCustomWidgets: _ => ({
        EASY_PROMPT_AWAIT_BAR: (node) => {
            const widgetValue = ref(JSON.stringify({
                select: 'now',
                unlock: true,
                last_seed:0,
                seed:0,
            }))
            const isEasyUseTheme = ['obsidian','obsidian_dark','milk_white'].includes(getSetting('Comfy.ColorPalette')) ? true : false
            const height = isEasyUseTheme ? 48 : 54
            return createVueWidget({
                name:'toolbar',
                node,
                options:{
                    getMinHeight: () => height,
                    getMaxHeight: () => height,
                    getValue: () => widgetValue.value,
                    setValue: (value) => {
                        try{
                            widgetValue.value = typeof(value) == 'object' ? JSON.stringify(value) : value
                        }catch(e){
                            console.error('EASY_MULTI_ANGLE setValue error:',e)
                        }
                    }
                },
            },promptAwaitBar)
        },
        EASY_PROMPT_STYLES: (node)=> {
            const widgetValue = ref('')
            return createVueWidget({
                name:'select_styles', 
                node, 
                options:{
                    getMinHeight: () => 180,
                    getMaxHeight: () => node.size[1] - 75,
                    getValue: ()=> widgetValue.value,
                    setValue: (value) => {
                        widgetValue.value = Array.isArray(value) ? value.join(',') : value
                    }
                },
                styles:{'overflow':'visible'}
            }, stylesSelector)
        },
        EASY_COMBO: (node, inputName, inputSpec) => {
            const widgetValue = ref('')
            const isEasyUseTheme = ['obsidian','obsidian_dark','milk_white'].includes(getSetting('Comfy.ColorPalette')) ? true : false
            const height = isEasyUseTheme ? 22 : 26
            return createVueWidget({
                name:'mask_components',
                node,
                options:{
                    margin: 0,
                    getMinHeight: () => height,
                    getMaxHeight: () => height,
                    getValue: () => widgetValue.value,
                    setValue: (value) => {
                        widgetValue.value = Array.isArray(value) ? value.join(',') : value
                    }
                },
                inputSpec: inputSpec?.[1],
                styles:{'overflow':'visible'}
            }, multiSelectWidget)
        },
        EASY_MULTI_ANGLE: (node) => {
            const widgetValue = ref(JSON.stringify([{
                rotate:0,
                vertical:0,
                zoom:5,
                add_angle_prompt:true
            }]))
            return createVueWidget({
                name:'multi_angle',
                node,
                options:{
                    getMinHeight: () => 350,
                    getMaxHeight: () => node.size[1] - 80,
                    getValue: () => widgetValue.value,
                    setValue: (value) => {
                        try{
                            widgetValue.value = Array.isArray(value) ? JSON.stringify(value) : value
                        }catch(e){
                            console.error('EASY_MULTI_ANGLE setValue error:',e)
                        }
                    }
                },
                styles:{'overflow':'visible'}
            },multiAngleWidget)
        }
    })
})