import { app, $el } from '@/composable/comfyAPI.js'
import {ref} from "vue";
import {useChainCallback} from "@/composable/utils/useChainCallback.js";
import {useDomWidgetStore} from "@/stores/domWidgetStore.js";

import {ComponentWidgetImpl} from "@/composable/widgets/domWidget.js";
import promptAwaitBar from "@/components/graph/widgets/promptAwait.vue";
app.registerExtension({
    name: 'Comfy.EasyUse.CustomWidget',
    getCustomWidgets: _ => ({
        EASY_PROMPT_AWAIT_BAR: (node, inputName, inputData, app) => {
            const widgetValue = ref( {
                select: 'now'
            })
            const inputSpec = {
                type: 'custom',
                name: inputName
            }
            const widget = new ComponentWidgetImpl({
                node,
                name: inputName,
                component: promptAwaitBar,
                inputSpec,
                options: {
                    getValue: () => widgetValue.value,
                    setValue: (value) => {
                        if(value){
                            console.log('setValue:',value)
                            widgetValue.value = value
                        }
                    }
                }
            })
            node.addCustomWidget(widget)
            node.onRemoved = useChainCallback(node.onRemoved, () => {
                widget.onRemove?.()
            })
            node.onResize = useChainCallback(node.onResize, () => {
                widget.options.beforeResize?.call(widget, node)
                widget.options.afterResize?.call(widget, node)
            })
            useDomWidgetStore().registerWidget(widget)
            return widget
        }
    })
})