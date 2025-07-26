import { app, $el } from '@/composable/comfyAPI.js'
import {ref} from "vue";
import {useChainCallback} from "@/composable/utils/useChainCallback.js";
import {useDomWidgetStore} from "@/stores/domWidgetStore.js";

import {ComponentWidgetImpl} from "@/composable/widgets/domWidget.js";
import promptAwaitBar from "@/components/graph/widgets/promptAwait.vue";
import multiSelectWidget from "@/components/graph/widgets/multiSelectWidget.vue";
import stylesSelector from '@/components/graph/widgets/stylesSelector.vue';
import {getSetting} from "@/composable/settings.js";

app.registerExtension({
    name: 'Comfy.EasyUse.CustomWidget',
    getCustomWidgets: _ => ({
        EASY_PROMPT_AWAIT_BAR: (node, inputName, inputData, app) => {
            const widgetValue = ref( {
                select: 'now',
                unlock: true,
                last_seed:0,
                seed:0,
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
        },
        EASY_COMBO: (node, inputName, inputData, app) => {
            const widgetValue = ref([])
            const inputSpec = {
                type: 'custom',
                name: inputName,
                options: inputData?.[1].options,
                multi_select: inputData?.[1].multi_select,
            }
            const isEasyUseTheme = ['obsidian','obsidian_dark','milk_white'].includes(getSetting('Comfy.ColorPalette')) ? true : false
            const height = isEasyUseTheme ? 22 : 26
            const widget = new ComponentWidgetImpl({
                node,
                name: inputName,
                component: multiSelectWidget,
                inputSpec,
                options: {
                    margin: 0,
                    getMinHeight: () => height,
                    getMaxHeight: () => height,
                    getValue: () => widgetValue.value,
                    setValue: (value) => {
                        if (value) {
                            console.log('setValue:', value)
                            if(!Array.isArray(value)) {
                                widgetValue.value = value.split(',').map(v => parseInt(v))
                            }
                            else widgetValue.value = value
                        }
                    }
                },
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
        },
        EASY_PROMPT_STYLES: (node, inputName, inputData, app) => {
            const widgetValue = ref([])
            const inputSpec = {
                type: 'custom',
                name: inputName,
            }
            const widget = new ComponentWidgetImpl({
                node,
                name: inputName,
                component: stylesSelector,
                inputSpec,
                options: {
                    margin: 10,
                    getMinHeight: () => 180,
                    getMaxHeight: () => node.size[1] - 75,
                    getValue: () => widgetValue.value,
                    setValue: (value) => {
                        if (value) {
                            console.log('setValue:', value)
                            if(!Array.isArray(value)) {
                                widgetValue.value = value.split(',')
                            }
                            else widgetValue.value = value
                        }
                    }
                },
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
        },
    }),

})