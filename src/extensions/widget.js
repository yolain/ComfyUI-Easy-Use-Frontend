import {api, app, ComfyWidgets} from "@/composable/comfyAPI.js";

import {$t} from "@/composable/i18n";
import {toggleWidget, getWidgetByName, updateNodeHeight} from "@/composable/node.js";
import {unsafeDrawBackground} from "@/composable/drawBackground.js";
import {toast} from "@/components/toast";
import sleep from "@/composable/sleep.js";
import {MAX_SEED_NUM} from "@/constants";

/* Variables */
const allow_widgets = [
    'rescale_after_model', 'rescale',
    'lora_name', 'upscale_method',
    'image_output', 'add_noise', 'info', 'sampler_name',
    'ckpt_B_name', 'ckpt_C_name', 'save_model', 'refiner_ckpt_name',
    'num_loras', 'num_controlnet', 'mode', 'toggle', 'resolution', 'ratio', 'target_parameter',
    'input_count', 'replace_count', 'downscale_mode', 'range_mode', 'text_combine_mode', 'input_mode',
    'lora_count', 'ckpt_count', 'conditioning_mode', 'preset', 'use_tiled', 'use_batch', 'num_embeds',
    "easing_mode", "guider", "scheduler", "inpaint_mode", 't5_type', 'rem_mode', 'encode', 'method'
]
// About ipadapter
const ipa_presets = [
    'LIGHT - SD1.5 only (low strength)',
    'STANDARD (medium strength)',
    'VIT-G (medium strength)',
    'REGULAR - FLUX and SD3.5 only (high strength)',
    'PLUS (high strength)',
    'PLUS (kolors genernal)',
    'PLUS FACE (portraits)',
    'FULL FACE - SD1.5 only (portraits stronger)',
    'COMPOSITION'
]
const ipa_loras_presets = [
    'FACEID',
    'FACEID PLUS - SD1.5 only',
    'FACEID PLUS V2',
    'FACEID PLUS KOLORS'
]
const ipa_faceid_presets = [
    ...ipa_loras_presets,
    ...['FACEID PORTRAIT (style transfer)', 'FACEID PORTRAIT UNNORM - SDXL only (strong)']
]
// Nodes List
const has_seed_nodes = ["easy seed", "easy latentNoisy", "easy wildcards", "easy preSampling", "easy preSamplingAdvanced", "easy preSamplingNoiseIn", "easy preSamplingSdTurbo", "easy preSamplingCascade", "easy preSamplingDynamicCFG", "easy preSamplingLayerDiffusion", "easy fullkSampler", "easy fullCascadeKSampler"]
const loader_nodes = ["easy fullLoader", "easy a1111Loader", "easy comfyLoader", "easy hyditLoader", "easy pixArtLoader"]
const samplers_nodes = ["easy fullkSampler", "easy kSampler", "easy kSamplerCustom", "easy kSamplerTiled", "easy kSamplerLayerDiffusion", "easy kSamplerInpainting", "easy kSamplerDownscaleUnet", "easy kSamplerSDTurbo", "easy fullCascadeKSampler", "easy cascadeKSampler"]
const image_dynamic_nodes = ["easy imageSize","easy imageSizeBySide","easy imageSizeByLongerSide","easy imageSizeShow", "easy imageRatio", "easy imagePixelPerfect"]
const loop_nodes = ['easy forLoopStart','easy forLoopEnd', 'easy whileLoopStart', 'easy whileLoopEnd']
const index_switch_nodes = ['easy anythingIndexSwitch', 'easy imageIndexSwitch', 'easy textIndexSwitch', 'easy conditioningIndexSwitch']
const inverse_switch_nodes = ['easy anythingInversedSwitch']
const change_slots_nodes = [...['easy loadImagesForLoop'],...loop_nodes,...index_switch_nodes,...inverse_switch_nodes]
const value_names = {'easy anythingInversedSwitch':'out', 'easy anythingIndexSwitch':'value', 'easy imageIndexSwitch':'image', 'easy textIndexSwitch':'text', 'easy conditioningIndexSwitch':'cond'}



let all_nodes = null
/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.Widget',

    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        const node_name = nodeData.name
        const onAdded = nodeType.prototype.onAdded;
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        const onConfigure = nodeType.prototype.onConfigure;
        const onExecuted = nodeType.prototype.onExecuted;
        const onConnectionsChange = nodeType.prototype.onConnectionsChange;

        // show the text of the widget
        if (['easy showAnything', 'easy showAnythingLazy', 'easy showTensorShape', "easy showSpentTime", 'easy imageInterrogator', 'easy showLoaderSettingsNames'].includes(node_name)) {
            function populate(text, name = 'text') {
                if (this.widgets) {
                    const pos = this.widgets.findIndex((w) => w.name === name);
                    if (pos !== -1) {
                        for (let i = pos; i < this.widgets.length; i++) {
                            this.widgets[i].onRemove?.();
                        }
                        this.widgets.length = pos;
                    }
                }
                for (const list of text) {
                    const w = ComfyWidgets["STRING"](this, "text", ["STRING", {multiline: true}], app).widget;
                    w.inputEl.readOnly = true;
                    w.inputEl.style.opacity = 0.6;
                    w.value = list;
                }
                requestAnimationFrame(() => {
                    const sz = this.computeSize();
                    if (sz[0] < this.size[0]) {
                        sz[0] = this.size[0];
                    }
                    if (sz[1] < this.size[1]) {
                        sz[1] = this.size[1];
                    }
                    this.onResize?.(sz);
                    app.graph.setDirtyCanvas(true, false);
                });
            }

            // When the node is executed we will be sent the input text, display this in the widget
            nodeType.prototype.onExecuted = function (message) {
                onExecuted?.apply(this, arguments);
                populate.call(this, message.text, 'text');
            };

            if (!['easy imageInterrogator'].includes(nodeData.name)) {
                nodeType.prototype.onConfigure = function () {
                    onConfigure?.apply(this, arguments);
                    let name = 'text'
                    switch (node_name) {
                        case 'easy showLoaderSettingsNames':
                            name = 'names'
                            break
                        case 'easy showSpentTime':
                            name = 'spent_time'
                            break
                        default:
                            name = 'text'
                    }
                    if (this.widgets_values?.length) {
                        populate.call(this, this.widgets_values, name);
                    }
                };
            }
        }

        // show the info of the image widget
        if(image_dynamic_nodes.includes(node_name)){
            function populate(arr_text) {
                var text = '';
                for (let i = 0; i < arr_text.length; i++){
                    text += arr_text[i];
                }
                if (this.widgets) {
                    const pos = this.widgets.findIndex((w) => w.name === "info");
                    if (pos !== -1 && this.widgets[pos]) {
                        const w = this.widgets[pos]
                        w.value = text;
                    }
                }
                requestAnimationFrame(() => {
                    const sz = this.computeSize();
                    if (sz[0] < this.size[0]) {
                        sz[0] = this.size[0];
                    }
                    if (sz[1] < this.size[1]) {
                        sz[1] = this.size[1];
                    }
                    this.onResize?.(sz);
                    app.graph.setDirtyCanvas(true, false);
                });
            }

            nodeType.prototype.onExecuted = function (message) {
                onExecuted?.apply(this, arguments);
                populate.call(this, message.text);
            };
        }

        // easy promptLine - Add a button for get other node's combo values to the prompt widget
        if (node_name == 'easy promptLine') {
            nodeType.prototype.onAdded = async function () {
                onAdded ? onAdded.apply(this, []) : undefined;
                let prompt_widget = this.widgets.find(w => w.name == "prompt")
                const button = this.addWidget("button", "get values from COMBO link", '', () => {
                    const output_link = this.outputs[1]?.links?.length > 0 ? this.outputs[1]['links'][0] : null
                    const all_nodes = app.graph._nodes
                    const node = all_nodes.find(cate => cate.inputs?.find(input => input.link == output_link))
                    if (!output_link || !node) {
                        toast.error($t('No COMBO link'), 3000)
                        return
                    } else {
                        const input = node.inputs.find(input => input.link == output_link)
                        const widget_name = input.widget.name
                        const widgets = node.widgets
                        const widget = widgets.find(cate => cate.name == widget_name)
                        let values = widget?.options.values || null
                        if (values) {
                            values = values.join('\n')
                            prompt_widget.value = values
                        }
                    }
                }, {
                    serialize: false
                })
            }
        }

        // loader nodes
        if (loader_nodes.includes(nodeData.name)) {
            function addText(arr_text) {
                var text = '';
                for (let i = 0; i < arr_text.length; i++) {
                    text += arr_text[i];
                }
                return text
            }

            function populate(text, type = 'positive') {
                if (this.widgets) {
                    const pos = this.widgets.findIndex((w) => w.name === type + "_prompt");
                    const className = "comfy-multiline-input wildcard_" + type + '_' + this.id.toString()
                    if (pos == -1 && text) {
                        const inputEl = document.createElement("textarea");
                        inputEl.className = className;
                        inputEl.placeholder = "Wildcard Prompt (" + type + ")"
                        const widget = this.addDOMWidget(type + "_prompt", "customtext", inputEl, {
                            getValue: _ => inputEl.value,
                            setValue(v) {
                                inputEl.value = v;
                            },
                            serialize: false,
                        });
                        widget.inputEl = inputEl;
                        widget.inputEl.readOnly = true
                        inputEl.addEventListener("input", () => {
                            widget.callback?.(widget.value);
                        });
                        widget.value = text;
                    } else if (this.widgets[pos]) {
                        if (text) {
                            const w = this.widgets[pos]
                            w.value = text;
                        } else {
                            this.widgets.splice(pos, 1);
                            const element = document.getElementsByClassName(className)
                            if (element && element[0]) element[0].remove()
                        }
                    }
                }
            }

            nodeType.prototype.onExecuted = function (message) {
                onExecuted?.apply(this, arguments);
                const positive = addText(message.positive)
                const negative = addText(message.negative)
                populate.call(this, positive, "positive");
                populate.call(this, negative, "negative");
            };
        }

        // sv3d loader
        if (["easy sv3dLoader"].includes(nodeData.name)) {
            function changeSchedulerText(mode, batch_size, inputEl) {
                switch (mode) {
                    case 'azimuth':
                        inputEl.readOnly = true
                        inputEl.style.opacity = 0.6
                        return `0:(0.0,0.0)` + (batch_size > 1 ? `\n${batch_size - 1}:(360.0,0.0)` : '')
                    case 'elevation':
                        inputEl.readOnly = true
                        inputEl.style.opacity = 0.6
                        return `0:(-90.0,0.0)` + (batch_size > 1 ? `\n${batch_size - 1}:(90.0,0.0)` : '')
                    case 'custom':
                        inputEl.readOnly = false
                        inputEl.style.opacity = 1
                        return `0:(0.0,0.0)\n9:(180.0,0.0)\n20:(360.0,0.0)`
                }
            }

            nodeType.prototype.onNodeCreated = async function () {
                onNodeCreated ? onNodeCreated.apply(this, []) : undefined;
                const easing_mode_widget = this.widgets.find(w => w.name == 'easing_mode')
                const batch_size = this.widgets.find(w => w.name == 'batch_size')
                const scheduler = this.widgets.find(w => w.name == 'scheduler')
                setTimeout(_ => {
                    if (!scheduler.value) scheduler.value = changeSchedulerText(easing_mode_widget.value, batch_size.value, scheduler.inputEl)
                }, 1)
                easing_mode_widget.callback = value => {
                    scheduler.value = changeSchedulerText(value, batch_size.value, scheduler.inputEl)
                }
                batch_size.callback = value => {
                    scheduler.value = changeSchedulerText(easing_mode_widget.value, value, scheduler.inputEl)
                }
            }
        }

        // seed nodes logic
        if (has_seed_nodes.includes(node_name)) {
            nodeType.prototype.onNodeCreated = async function () {
                onNodeCreated ? onNodeCreated.apply(this, []) : undefined;
                const seed_widget = this.widgets.find(w => ['seed_num', 'seed'].includes(w.name))
                const seed_control = this.widgets.find(w => ['control before generate', 'control after generate','control_before_generate', 'control_after_generate'].includes(w.name))
                if (nodeData.name == 'easy seed' && seed_control) {
                    const randomSeedButton = this.addWidget("button", "🎲 Manual Random Seed", null, _ => {
                        if (seed_control.value != 'fixed') seed_control.value = 'fixed'
                        seed_widget.value = Math.floor(Math.random() * MAX_SEED_NUM)
                        app.queuePrompt(0, 1)
                    }, {serialize: false})
                    seed_widget.linkedWidgets = [randomSeedButton, seed_control];
                }
            }
            nodeType.prototype.onAdded = async function () {
                onAdded ? onAdded.apply(this, []) : undefined;
                const seed_widget = this.widgets.find(w => ['seed_num', 'seed'].includes(w.name))
                const seed_control = this.widgets.find(w => ['control before generate', 'control after generate', 'control_before_generate', 'control_after_generate'].includes(w.name))
                if(seed_control){
                    setTimeout(_ => {
                        if (['control before generate','control_before_generate'].includes(seed_control.name) && seed_widget.value === 0) {
                            seed_widget.value = Math.floor(Math.random() * MAX_SEED_NUM)
                        }
                    }, 1)
                }

            }
        }

        // easy convertAnything - Convert Any Type to Any Type
        if (node_name == 'easy convertAnything') {
            nodeType.prototype.onNodeCreated = async function () {
                onNodeCreated ? onNodeCreated.apply(this, []) : undefined;

                const type_control = this.widgets.find(w => w.name == "output_type")
                const changeType = _ => {
                    this.outputs[0].type = (type_control.value).toUpperCase()
                    this.outputs[0].name = type_control.value
                    this.outputs[0].label = type_control.value
                }
                setTimeout(_ => changeType(), 10)
                type_control.callback = _ => changeType()
            }
        }

        // easy imageInsetCrop
        if (node_name == 'easy imageInsetCrop') {
            function setWidgetStep(a) {
                const measurementWidget = a.widgets[0]
                for (let i = 1; i <= 4; i++) {
                    if (measurementWidget.value === 'Pixels') {
                        a.widgets[i].options.step = 80;
                        if(a.widgets[i].options.step2 !== undefined) a.widgets[i].options.step2 = 8;
                        a.widgets[i].options.max = 8192;
                    } else {
                        a.widgets[i].options.step = 10;
                        if(a.widgets[i].options.step2 !== undefined) a.widgets[i].options.step2 = 1;
                        a.widgets[i].options.max = 99;
                    }
                }
            }

            nodeType.prototype.onAdded = async function (graph) {
                const measurementWidget = this.widgets[0];
                let callback = measurementWidget.callback;
                measurementWidget.callback = (...args) => {
                    setWidgetStep(this);
                    callback && callback.apply(measurementWidget, [...args]);
                };
                setTimeout(_ => {
                    setWidgetStep(this);
                }, 1)
            }
        }

        // add or remove the slots
        if(change_slots_nodes.includes(node_name)) {

            const getStartInputIndex = _=>{
                switch (node_name){
                    case 'easy forLoopStart':
                    case 'easy whileLoopStart':
                        return 0
                    case 'easy forLoopEnd':
                    case 'easy whileLoopEnd':
                        return 1

                }
            }

            const getStartOutputIndex = _=>{
                switch (node_name){
                    case 'easy forLoopStart':
                        return 2
                    case 'easy forLoopEnd':
                    case 'easy whileLoopEnd':
                        return 0
                    case 'easy whileLoopStart':
                        return 1
                }
            }

            nodeType.prototype.onNodeCreated = async function () {
                // change shape of flow
                if(node_name == 'easy loadImagesForLoop') this.outputs[0]['shape'] = 5
                if(loop_nodes.includes(node_name)) {
                    const flow_intput_index = this.inputs.findIndex(cate => cate.name === 'flow')
                    const flow_output_index = this.outputs.findIndex(cate => cate.name === 'flow')
                    if (flow_intput_index !== -1) this.inputs[flow_intput_index]['shape'] = 5
                    if (flow_output_index !== -1) this.outputs[flow_output_index]['shape'] = 5
                    // await sleep(1)
                    // if(node_name == 'easy whileLoopStart' || node_name == 'easy whileLoopEnd') return
                    this.inputs = this.inputs.filter((cate,index) => index <= getStartInputIndex() || cate.widget)
                    this.outputs = this.outputs.filter((cate,index) => index <= getStartOutputIndex())
                    updateNodeHeight(this)
                }
                // change index of index switch nodes
                if(index_switch_nodes.includes(node_name)){
                   if(node_name == 'easy textIndexSwitch'){
                       this.widgets = this.widgets.filter((cate,index) => index <= 2)
                   }
                    this.inputs = this.inputs.filter((cate,index) => index <= 1 || cate.widget)
                    updateNodeHeight(this)
                }
                return onNodeCreated?.apply(this, arguments)
            }
            nodeType.prototype.onConnectionsChange = function (type, index, connected, link_info) {
                // if(node_name == 'easy whileLoopStart' || node_name == 'easy whileLoopEnd') return
                if (!link_info) return
                // input
                if (type == 1) {
                    let is_input_all_connected = this.inputs.every(cate => cate.link !== null || cate.widget)
                    let inputs = this.inputs.filter(cate=> !['condition','index','total'].includes(cate.name))
                    // loop nodes
                    if(loop_nodes.includes(node_name)){
                        if (is_input_all_connected) {
                            if (inputs.length >= 20) {
                                toast.warn($t('The maximum number of inputs is 20'))
                                return
                            }
                            let input = inputs[inputs.length - 1]
                            let add_key = parseInt(input.name.split('initial_value')[1])+1
                            if(this.inputs.find(cate => cate.name === 'initial_value' + add_key)) return
                            let input_label = 'initial_value' + (add_key)
                            let output_label = 'value' + (add_key)
                            this.addInput(input_label, '*')
                            this.addOutput(output_label, '*')
                        } else if (!connected) {
                            const start_index = getStartInputIndex()
                            let lastInputIndex = this.inputs.findLastIndex(cate => cate.link)
                            if (index >= start_index && (lastInputIndex===-1 || index >= lastInputIndex)){
                                let input = this.inputs[index]
                                if(!input.name || ['condition','total'].includes(input.name)) return
                                let remove_key = parseInt(input.name.split('initial_value')[1])+1
                                let inputIndex = this.inputs.findIndex(cate => cate.name === 'initial_value' + remove_key)
                                let outputIndex = this.outputs.findIndex(cate => cate.name === 'value' + remove_key)
                                if(inputIndex !== -1) this.removeInput(inputIndex)
                                if(outputIndex !== -1) this.removeOutput(outputIndex)
                            }
                        }
                    }
                    // index switch nodes
                    else if(index_switch_nodes.includes(node_name)){
                        if (is_input_all_connected) {
                            if (inputs.length >= 20) {
                                toast.warn($t('The maximum number of inputs is 20'))
                                return
                            }
                            let input_label = value_names[node_name] + (inputs.length)
                            this.addInput(input_label, '*')
                        } else if (!connected) {
                            if (index == this.inputs.length - 2) {
                                this.removeInput(index+1)
                            }
                        }
                    }
                }
                // output
                else if(type == 2){
                    let outputs = this.outputs.filter(cate=> !['flow','index'].includes(cate.name))
                    let is_output_all_connected = outputs.every(cate => cate.links?.length > 0)
                    // loop nodes
                    if(loop_nodes.includes(node_name)) {
                        if (is_output_all_connected) {
                            if (outputs.length >= 20) {
                                toast.warn($t('The maximum number of outputs is 20'))
                                return
                            }
                            let output = outputs[outputs.length - 1]
                            let add_key = parseInt(output.name.split('value')[1])+1
                            if(this.inputs.find(cate => cate.name === 'initial_value' + add_key)) return
                            if(this.outputs.find(cate => cate.name === 'value' + add_key)) return
                            let input_label = 'initial_value' + (add_key)
                            let output_label = 'value' + (add_key)
                            this.addInput(input_label, '*')
                            this.addOutput(output_label, '*')
                        }else if (!connected) {
                            const start_index = getStartOutputIndex()
                            let index = link_info.origin_slot
                            let lastOutputIndex = this.outputs.findLastIndex(cate => cate.links?.length > 0)
                            if (index >= start_index && (lastOutputIndex===-1 || index >= lastOutputIndex)){
                                let output = this.outputs[index]
                                if(!output.name || ['flow','index'].includes(output.name)) return
                                let remove_key = parseInt(output.name.split('value')[1])+1
                                let inputIndex = this.inputs.findIndex(cate => cate.name === 'initial_value' + remove_key)
                                let outputIndex = this.outputs.findIndex(cate => cate.name === 'value' + remove_key)
                                if(inputIndex !== -1 && this.inputs[inputIndex]?.['link']) return
                                if(inputIndex !== -1 ) this.removeInput(inputIndex)
                                if(outputIndex !== -1 ) this.removeOutput(outputIndex)
                            }
                        }
                    }
                    // inverse switch nodes
                    else if(inverse_switch_nodes.includes(node_name)){
                        if(is_output_all_connected) {
                            if (outputs.length >= 20) {
                                toast.warn($t('The maximum number of outputs is 20'))
                                return
                            }
                            let output_label = value_names[node_name] + (outputs.length)
                            this.addOutput(output_label, '*')
                        } else if (!connected) {
                            let index = link_info.origin_slot
                            if (index == this.outputs.length - 2 && outputs[index].links?.length == 0) {
                                this.removeOutput(index + 1)
                            }
                        }
                    }
                }
            }
        }
        if(['easy fluxLoader', 'easy fullLoader'].includes(node_name)){
            nodeType.prototype.onConnectionsChange = async function (output, input) {
                onConnectionsChange ? onConnectionsChange.apply(this, []) : undefined;
                const model = this.inputs.find(cate => cate.name === 'model_override')
                const vae = this.inputs.find(cate => cate.name === 'vae_override')
                let ckpt_name = getWidgetByName(this, 'ckpt_name')
                let vae_name = getWidgetByName(this, 'vae_name')
                if(model?.link && input == 0){
                    const ckpt_names = ckpt_name?.options.values || []
                    setTimeout(_ => {
                        this.widgets[0].value = ckpt_names?.[0] || 'None'
                        toggleWidget(this, ckpt_name, model?.link ? false : true)
                    }, 1)
                }
                else toggleWidget(this, ckpt_name, model?.link ? false : true)
                if(vae?.link && (input == 1 || input == 2)){
                    let vaeIndex = this.widgets.findIndex(w => w.name == 'vae_name')
                    setTimeout(_ => {
                        this.widgets[vaeIndex].value = 'Baked VAE'
                        toggleWidget(this, vae_name, vae?.link ? false : true)
                    },1)
                }
                else toggleWidget(this, vae_name, vae?.link ? false : true)
            }
        }

        if(samplers_nodes.includes(node_name) || (node_name.indexOf('workflow') !== -1)){
            const input_required = nodeData?.input?.required || {}
            if(!input_required['image_output'] && !input_required['图像输出'] && !input_required['视频输出']) return
            nodeType.prototype.onDrawBackground = function(ctx) {
                try {
                    unsafeDrawBackground(this, ctx)
                } catch (error) {
                    console.error('Error drawing node background', error)
                }
            }
        }
    },


    nodeCreated(node) {
        // toggle widgets
        if (node.comfyClass.startsWith("easy ")) {
            if(node.widgets){
                for (const w of node.widgets) {
                    if (!allow_widgets.includes(w.name)) continue
                    let widgetValue = w.value;
                    toggleLogic(node, w)
                    // Define getters and setters for widget values
                    Object.defineProperty(w, 'value', {
                        get: _ => widgetValue,
                        set(newVal) {
                            if (newVal !== widgetValue) {
                                widgetValue = newVal;
                                requestAnimationFrame(_=>{
                                    toggleLogic(node, w)
                                })
                            }
                        }
                    });
                }
            }

            const node_name = node.comfyClass

            // easy detailerfix
            if (node_name == 'easy preDetailerFix') {
                const textarea_widget = node.widgets.find(w => w.type === "customtext");
                if (!textarea_widget) return
                textarea_widget.dynamicPrompts = false
                textarea_widget.inputEl.placeholder = "wildcard spec: if kept empty, this option will be ignored";
                textarea_widget.serializeValue = () => {
                    return textarea_widget.value
                };
            }

            // easy wildcards
            if (['easy wildcards','easy wildcardsMatrix'].includes(node_name)) {
                const wildcard_text_widget = node.widgets.find(w => w.name == 'text');
                let combo_id = 1;
                Object.defineProperty(node.widgets[combo_id], "value", {
                    set: (value) => {
                        // const stackTrace = new Error().stack;
                        // if (stackTrace.includes('inner_value_change') || stackTrace.includes('inner_onclick')) {
                        //
                        // }
                        if (value != "Select the LoRA to add to the text") {
                            let lora_name = value;
                            if (lora_name.endsWith('.safetensors'))  lora_name = lora_name.slice(0, -12);
                            wildcard_text_widget.value += `<lora:${lora_name}>`;
                        }
                    },
                    get: _ => "Select the LoRA to add to the text"
                });

                Object.defineProperty(node.widgets[combo_id + 1], "value", {
                    set: (value) => {
                        // const stackTrace = new Error().stack;
                        // if (stackTrace.includes('inner_value_change') || stackTrace.includes('inner_onclick')) {
                        //
                        // }
                        if (value != "Select the Wildcard to add to the text") {
                            if (wildcard_text_widget.value != '') wildcard_text_widget.value += ', '
                            wildcard_text_widget.value += value;
                        }
                    },
                    get: _ => "Select the Wildcard to add to the text"
                });
                // Preventing validation errors from occurring in any situation.
                node.widgets[combo_id].serializeValue = _ => "Select the LoRA to add to the text";
                node.widgets[combo_id + 1].serializeValue = _ => "Select the Wildcard to add to the text";
            }

            // easy prompt
            if (node_name == 'easy prompt') {
                const prompt_text_widget = node.widgets.find(w => w.name == 'text');
                let combo_id = 1;
                Object.defineProperty(node.widgets[combo_id], "value", {
                    set: (value) => {
                        if (value != "Select the prefix to add to the text" && node.widgets[combo_id]?.['options']?.['values'].includes(value)) {
                            if (prompt_text_widget.value == '') prompt_text_widget.value += value;
                            else prompt_text_widget.value += ' ' + value;
                        }
                    },
                    get: _ => "Select the prefix to add to the text"
                });

                Object.defineProperty(node.widgets[combo_id + 1], "value", {
                    set: (value) => {
                        if (value != "👤Select the subject add to the text" && node.widgets[combo_id + 1]?.['options']?.['values'].includes(value)) {
                            if (prompt_text_widget.value == '') prompt_text_widget.value += value;
                            else prompt_text_widget.value += ' ' + value;
                        }
                    },
                    get: _ => "👤Select the subject add to the text"
                });

                Object.defineProperty(node.widgets[combo_id + 2], "value", {
                    set: (value) => {
                        if (value != "🎬Select the action add to the text" && node.widgets[combo_id + 2]?.['options']?.['values'].includes(value)) {
                            if (prompt_text_widget.value == '') prompt_text_widget.value += value;
                            else prompt_text_widget.value += ',' + value;
                        }
                    },
                    get: _ => "🎬Select the action add to the text"
                });

                Object.defineProperty(node.widgets[combo_id + 3], "value", {
                    set: (value) => {
                        if (value != "👚Select the clothes add to the text" && node.widgets[combo_id + 3]?.['options']?.['values'].includes(value)) {
                            if (prompt_text_widget.value == '') prompt_text_widget.value += value;
                            else prompt_text_widget.value += ',' + value;
                        }
                    },
                    get: _ => "👚Select the clothes add to the text"
                });

                Object.defineProperty(node.widgets[combo_id + 4], "value", {
                    set: (value) => {
                        if (value != "☀️Select the illumination environment add to the text" && node.widgets[combo_id + 4]?.['options']?.['values'].includes(value)) {
                            if (prompt_text_widget.value == '') prompt_text_widget.value += value;
                            else prompt_text_widget.value += ',' + value;
                        }
                    },
                    get: _ => "☀️Select the illumination environment add to the text"
                });

                Object.defineProperty(node.widgets[combo_id + 5], "value", {
                    set: (value) => {
                        if (value != "🎞️Select the background add to the text" && node.widgets[combo_id + 5]?.['options']?.['values'].includes(value)) {
                            if (prompt_text_widget.value == '') prompt_text_widget.value += value;
                            else prompt_text_widget.value += ' ' + value;
                        }
                    },
                    get: _ => "🎞️Select the background add to the text"
                });

                Object.defineProperty(node.widgets[combo_id + 6], "value", {
                    set: (value) => {
                        if (value != "🔞Select the nsfw add to the text" && node.widgets[combo_id + 6]?.['options']?.['values'].includes(value)) {
                            if (prompt_text_widget.value == '') prompt_text_widget.value += value;
                            else prompt_text_widget.value += ',' + value;
                        }
                    },
                    get: _ => "🔞Select the nsfw add to the text"
                });
                // Preventing validation errors from occurring in any situation.
                node.widgets[combo_id].serializeValue = _ => "Select the prefix add to the text";
                node.widgets[combo_id + 1].serializeValue = _ => "👤Select the subject add to the text";
                node.widgets[combo_id + 2].serializeValue = _ => "🎬Select the action add to the text";
                node.widgets[combo_id + 3].serializeValue = _ => "👚Select the clothes add to the text";
                node.widgets[combo_id + 4].serializeValue = _ => "☀️Select the illumination environment add to the text";
                node.widgets[combo_id + 5].serializeValue = _ => "🎞️Select the background add to the text";
                node.widgets[combo_id + 6].serializeValue = _ => "🔞Select the nsfw add to the text";
            }

            // image dynamic nodes
            if (image_dynamic_nodes.includes(node_name)) {
                const inputEl = document.createElement("textarea");
                inputEl.className = "comfy-multiline-input";
                inputEl.readOnly = true

                const widget = node.addDOMWidget("info", "customtext", inputEl, {
                    getValue: _ => inputEl.value,
                    setValue: v => inputEl.value = v,
                    serialize: false
                });
                widget.inputEl = inputEl;

                inputEl.addEventListener("input", () => {
                    widget.callback?.(widget.value);
                });
            }

            // todo:easy xyinputs:modelmergeblock
        }
    },
})

/* Functions */
/**
 * toggle Logic - Toggle widgets based on the value of a widget
 * @param node
 * @param widget
 */
function toggleLogic(node, widget) {
    const node_name = node.comfyClass
    let v = widget.value
    switch (widget.name) {
        // Range Int or Range Flot
        case 'range_mode':
            toggleWidget(node, getWidgetByName(node, 'step'), v == 'step' ? true : false)
            toggleWidget(node, getWidgetByName(node, 'num_steps'), v == 'num_steps' ? true : false)
            updateNodeHeight(node)
            break
        // Latent Composite
        case 'text_combine_mode':
            toggleWidget(node, getWidgetByName(node, 'replace_text'), v == 'replace' ? true : false)
            break
        // Loader Widgets
        case 'lora_name':
            ['lora_model_strength', 'lora_clip_strength'].map(name => toggleWidget(node, getWidgetByName(node, name), v !== "None" ? true : false))
            break
        case 'resolution':
            if (v === "自定义 x 自定义") {
                widget.value = 'width x height (custom)'
            }
            ['empty_latent_width', 'empty_latent_height', 'width', 'height'].map(name => toggleWidget(node, getWidgetByName(node, name), v === 'width x height (custom)' ? true : false))
            break
        case 'ratio':
            ['empty_latent_width', 'empty_latent_height'].map(name => toggleWidget(node, getWidgetByName(node, name), v === 'custom' ? true : false))
            break
        case 'num_loras':
            var number_to_show = v + 1
            var mode = getWidgetByName(node, 'mode')?.value
            requestAnimationFrame(_=>{
                for (let i = 0; i < number_to_show; i++) {
                    toggleWidget(node, getWidgetByName(node, 'lora_' + i + '_name'), true);
                    toggleWidget(node, getWidgetByName(node, 'lora_' + i + '_strength'), mode === "simple" ? true : false);
                    ['lora_' + i + '_model_strength', 'lora_' + i + '_clip_strength'].map(name => toggleWidget(node, getWidgetByName(node, name), mode === "simple" ? false : true))
                }
                for (let i = number_to_show; i < 99; i++) {
                    ['lora_' + i + '_name', 'lora_' + i + '_strength', 'lora_' + i + '_model_strength', 'lora_' + i + '_clip_strength'].map(name => toggleWidget(node, getWidgetByName(node, name), false))
                }
                updateNodeHeight(node)
            })
            break
        case 'num_controlnet':
            var number_to_show = v + 1
            var mode = getWidgetByName(node, 'mode').value
            for (let i = 0; i < number_to_show; i++) {
                ['controlnet_' + i, 'controlnet_' + i + '_strength', 'scale_soft_weight_' + i].map(name => toggleWidget(node, getWidgetByName(node, name), true));
                ['start_percent_' + i, 'end_percent_' + i].map(name => toggleWidget(node, getWidgetByName(node, name), mode === "simple" ? false : true))
            }
            for (let i = number_to_show; i < 21; i++) {
                ['controlnet_' + i, 'controlnet_' + i + '_strength', 'scale_soft_weight_' + i, 'start_percent_' + i, 'end_percent_' + i].map(name => toggleWidget(node, getWidgetByName(node, name), false))
            }
            updateNodeHeight(node)
            break
        case 'mode':
            switch (node?.comfyClass) {
                case 'easy loraStack':
                    var number_to_show = getWidgetByName(node, 'num_loras').value + 1
                    var mode = v
                    for (let i = 0; i < number_to_show; i++) {
                        toggleWidget(node, getWidgetByName(node, 'lora_' + i + '_strength'), mode === "simple" ? true : false);
                        ['lora_' + i + '_model_strength', 'lora_' + i + '_clip_strength'].map(name => toggleWidget(node, getWidgetByName(node, name), mode === "simple" ? false : true))
                    }
                    updateNodeHeight(node)
                    break
                case 'easy controlnetStack':
                    var number_to_show = getWidgetByName(node, 'num_controlnet').value + 1
                    var mode = v
                    for (let i = 0; i < number_to_show; i++) {
                        ['start_percent_' + i, 'end_percent_' + i].map(name => toggleWidget(node, getWidgetByName(node, name), mode === "simple" ? false : true))
                    }
                    updateNodeHeight(node)
                    break
                case 'easy icLightApply':
                    var mode = v;
                    ['lighting', 'remove_bg'].map(name => toggleWidget(node, getWidgetByName(node, name), mode === "Foreground" ? true : false));
                    toggleWidget(node, getWidgetByName(node, 'source'), mode === "Foreground" ? false : true)
                    updateNodeHeight(node)
                    break
                default:
                    break
            }
            break
        case 'toggle':
            widget.type = 'toggle'
            widget.options = {on: 'Enabled', off: 'Disabled'}
            break
        case 't5_type':
            ['clip_name', 'padding'].map(name => toggleWidget(node, getWidgetByName(node, name), v == 'sd3' ? true : false));
            ['t5_name', 'device', 'dtype'].map(name => toggleWidget(node, getWidgetByName(node, name), v == 't5v11' ? true : false));
            updateNodeHeight(node)
            break

        // IPAdapter Widgets
        case 'preset':
            if(v == 'FLUX.1-dev') widget.value = 'REGULAR - FLUX and SD3.5 only (high strength)'
            if (ipa_presets.includes(v)) {
                let use_tiled = getWidgetByName(node, 'use_tiled')
                toggleWidget(node, getWidgetByName(node, 'lora_strength'))
                toggleWidget(node, getWidgetByName(node, 'provider'), ['REGULAR - FLUX and SD3.5 only (high strength)'].includes(v) ? true : false)
                toggleWidget(node, getWidgetByName(node, 'weight_faceidv2'))
                toggleWidget(node, getWidgetByName(node, 'weight_kolors'))
                toggleWidget(node, getWidgetByName(node, 'use_tiled'), true)
                toggleWidget(node, getWidgetByName(node, 'sharpening'), use_tiled && use_tiled.value)
            } else if (ipa_faceid_presets.includes(v)) {
                toggleWidget(node, getWidgetByName(node, 'weight_faceidv2'), ['FACEID PLUS V2','FACEID PLUS KOLORS'].includes(v) ? true :false);
                toggleWidget(node, getWidgetByName(node, 'weight_kolors'), ['FACEID PLUS KOLORS'].includes(widget.value) ? true : false);
                if (['FACEID PLUS KOLORS','FACEID PORTRAIT (style transfer)', 'FACEID PORTRAIT UNNORM - SDXL only (strong)'].includes(v)) {
                    toggleWidget(node, getWidgetByName(node, 'lora_strength'), false)
                } else {
                    toggleWidget(node, getWidgetByName(node, 'lora_strength'), true)
                }
                toggleWidget(node, getWidgetByName(node, 'provider'), true)
                toggleWidget(node, getWidgetByName(node, 'use_tiled'))
                toggleWidget(node, getWidgetByName(node, 'sharpening'))
            }
            updateNodeHeight(node)
            break
        case 'use_tiled':
            toggleWidget(node, getWidgetByName(node, 'sharpening'), v ? true : false)
            updateNodeHeight(node)
            break
        case 'num_embeds':
            var number_to_show = v + 1
            for (let i = 0; i < number_to_show; i++) {
                toggleWidget(node, getWidgetByName(node, 'weight' + i), true)
            }
            for (let i = number_to_show; i < 6; i++) {
                toggleWidget(node, getWidgetByName(node, 'weight' + i))
            }
            updateNodeHeight(node)
            break

        // Apply inpaint
        case 'inpaint_mode':
            switch (v) {
                case 'normal':
                case 'fooocus_inpaint':
                    ['dtype', 'fitting', 'function', 'scale', 'start_at', 'end_at'].map(name => toggleWidget(node, getWidgetByName(node, name), false))
                    break
                case 'brushnet_random':
                case 'brushnet_segmentation':
                    ['dtype', 'scale', 'start_at', 'end_at'].map(name => toggleWidget(node, getWidgetByName(node, name), true));
                    ['fitting', 'function'].map(name => toggleWidget(node, getWidgetByName(node, name), false))
                    break
                case 'powerpaint':
                    ['dtype', 'fitting', 'function', 'scale', 'start_at', 'end_at'].map(name => toggleWidget(node, getWidgetByName(node, name), true))
                    break
            }
            updateNodeHeight(node)
            break
        case 'encode':
            toggleWidget(node, getWidgetByName(node, 'noise_mask'), ['inpaint_model_conditioning','different_diffusion'].includes(v) ? true : false)
            updateNodeHeight(node)
            break
        // PreSampling or Sampler
        case 'image_output':
            toggleWidget(node, getWidgetByName(node, 'link_id'), ['Sender', 'Sender&Save'].includes(v) ? true : false);
            toggleWidget(node, getWidgetByName(node, 'decode_vae_name'), ['Hide', 'Hide&Save'].includes(v) ? true : false);
            ['save_prefix', 'output_path', 'embed_workflow', 'number_padding', 'overwrite_existing'].map(name => toggleWidget(node, getWidgetByName(node, name), ['Save', 'Hide&Save', 'Sender&Save'].includes(v) ? true : false))
            break
        case 'add_noise':
            var control_before_widget = getWidgetByName(node, 'control_before_generate')
            var control_after_widget = getWidgetByName(node, 'control_after_generate')
            var control_widget = control_after_widget || control_before_widget
            if (v === "disable") {
                toggleWidget(node, getWidgetByName(node, 'seed'))
                if (control_widget) {
                    control_widget.last_value = control_widget.value
                    control_widget.value = 'fixed'
                    toggleWidget(node, control_widget)
                }
            } else {
                if(v === 'enable') widget.value = 'enable (CPU)'
                toggleWidget(node, getWidgetByName(node, 'seed'), true)
                if (control_widget) {
                    if (control_widget?.last_value) control_widget.value = control_widget.last_value
                    toggleWidget(node, control_widget, true)
                }
            }
            updateNodeHeight(node)
            break
        case 'guider':
            switch (v) {
                case 'Basic':
                case 'IP2P+Basic':
                    ['cfg_negative'].map(name => toggleWidget(node, getWidgetByName(node, name)))
                    break
                case 'CFG':
                case 'IP2P+CFG':
                    toggleWidget(node, getWidgetByName(node, 'cfg'), true);
                    toggleWidget(node, getWidgetByName(node, 'cfg_negative'))
                    break
                case 'DualCFG':
                case 'IP2P+DualCFG':
                    ['cfg', 'cfg_negative'].map(name => toggleWidget(node, getWidgetByName(node, name),true))
                    break
            }
            updateNodeHeight(node)
            break
        case 'scheduler':
            if(node_name == 'easy preSamplingCustom'){
                if (['karrasADV', 'exponentialADV', 'polyExponential'].includes(v)) {
                    ['sigma_max', 'sigma_min'].map(name => toggleWidget(node, getWidgetByName(node, name), true));
                    ['denoise', 'beta_d', 'beta_min', 'eps_s', 'coeff'].map(name => toggleWidget(node, getWidgetByName(node, name)), false)
                    toggleWidget(node, getWidgetByName(node, 'rho'), v != 'exponentialADV' ? true : false)
                } else if (v == 'vp') {
                    ['sigma_max', 'sigma_min', 'denoise', 'rho', 'coeff'].map(name => toggleWidget(node, getWidgetByName(node, name)));
                    ['beta_d', 'beta_min', 'eps_s'].map(name => toggleWidget(node, getWidgetByName(node, name), true))
                } else {
                    ['sigma_max', 'sigma_min', 'beta_d', 'beta_min', 'eps_s', 'rho'].map(name => toggleWidget(node, getWidgetByName(node, name)))
                    toggleWidget(node, getWidgetByName(node, 'coeff'), v == 'gits' ? true : false);
                    toggleWidget(node, getWidgetByName(node, 'denoise',), true);
                }
                updateNodeHeight(node)
            }
            break

        // Pipe Edit
        case 'conditioning_mode':
            if (["replace", "concat", "combine"].includes(v)) {
                ['average_strength', 'old_cond_start', 'old_cond_end', 'new_cond_start', 'new_cond_end'].map(name => toggleWidget(node, getWidgetByName(node, name)))
            } else if (v == 'average') {
                toggleWidget(node, getWidgetByName(node, 'average_strength'), true);
                ['old_cond_start', 'old_cond_end', 'new_cond_start', 'new_cond_end'].map(name => toggleWidget(node, getWidgetByName(node, name), false))
            } else if (v == 'timestep') {
                ['average_strength'].map(name => toggleWidget(node, getWidgetByName(node, name), false));
                ['old_cond_start', 'old_cond_end', 'new_cond_start', 'new_cond_end'].map(name => toggleWidget(node, getWidgetByName(node, name), true))
            }
            break

        // Hires Fix
        case 'rescale':
            let rescale_after_model = getWidgetByName(node, 'rescale_after_model').value
            toggleWidget(node, getWidgetByName(node, 'width'), v === 'to Width/Height' ? true : false);
            toggleWidget(node, getWidgetByName(node, 'height'), v === 'to Width/Height' ? true : false);
            toggleWidget(node, getWidgetByName(node, 'percent'), v === 'by percentage' ? true : false);
            toggleWidget(node, getWidgetByName(node, 'longer_side'), v === 'to longer side - maintain aspect' ? true : false)
            updateNodeHeight(node)
            break
        case 'upscale_method':
            ['factor', 'crop'].map(name => toggleWidget(node, getWidgetByName(node, name), v === 'None' ? false : true))
            break

        // XY Input
        case 'target_parameter':
            switch (node_name) {
                case 'easy XYInputs: Steps':
                    ['first_step', 'last_step'].map(name => toggleWidget(node, getWidgetByName(node, name), v == 'steps' ? true : false));
                    ['first_start_step', 'last_start_step'].map(name => toggleWidget(node, getWidgetByName(node, name), v == 'start_at_step' ? true : false));
                    ['first_end_step', 'last_end_step'].map(name => toggleWidget(node, getWidgetByName(node, name), v == 'end_at_step' ? true : false))
                    break
                case 'easy XYInputs: Sampler/Scheduler':
                    let number_to_show = getWidgetByName(node, 'input_count').value + 1
                    for (let i = 0; i < number_to_show; i++) {
                        toggleWidget(node, getWidgetByName(node, 'sampler_' + i), v !== 'scheduler' ? true : false);
                        toggleWidget(node, getWidgetByName(node, 'scheduler_' + i), v !== 'sampler' ? true : false)
                    }
                    updateNodeHeight(node)
                    break
                case 'easy XYInputs: ControlNet':
                    ['first_strength', 'last_strength'].map(name => toggleWidget(node, getWidgetByName(node, name), v == 'strength' ? true : false));
                    ['first_start_percent', 'last_start_percent'].map(name => toggleWidget(node, getWidgetByName(node, name), v == 'start_percent' ? true : false));
                    ['first_end_percent', 'last_end_percent'].map(name => toggleWidget(node, getWidgetByName(node, name), v == 'end_percent' ? true : false));
                    ['strength', 'start_percent', 'end_percent'].map(name => toggleWidget(node, getWidgetByName(node, name), v == name ? false : true))
                    updateNodeHeight(node)
            }
        case 'replace_count':
            var number_to_show = v + 1
            for (let i = 0; i < number_to_show; i++) {
                toggleWidget(node, getWidgetByName(node, 'replace_' + i), true)
            }
            for (let i = number_to_show; i < 31; i++) {
                toggleWidget(node, getWidgetByName(node, 'replace_' + i))
            }
            updateNodeHeight(node)
            break
        case 'lora_count':
            var number_to_show = v + 1
            var has_weight = getWidgetByName(node, 'input_mode').value.indexOf("Weights") == -1
            for (let i = 0; i < number_to_show; i++) {
                toggleWidget(node, getWidgetByName(node, 'lora_name_' + i), true);
                ['model_str_' + i, 'clip_str_' + i].map(name => toggleWidget(node, getWidgetByName(node, name), has_weight ? false : true))
            }
            for (let i = number_to_show; i < 11; i++) {
                ['lora_name_' + i, 'model_str_' + i, 'clip_str_' + i].map(name => toggleWidget(node, getWidgetByName(node, name), false))
            }
            updateNodeHeight(node)
            break
        case 'ckpt_count':
            var number_to_show = v + 1
            var has_clipskip = getWidgetByName(node, 'input_mode').value.indexOf("ClipSkip") != -1
            var has_vae = getWidgetByName(node, 'input_mode').value.indexOf("VAE") != -1
            for (let i = 0; i < number_to_show; i++) {
                toggleWidget(node, getWidgetByName(node, 'ckpt_name_' + i), true)
                toggleWidget(node, getWidgetByName(node, 'clip_skip_' + i), has_clipskip ? true : false)
                toggleWidget(node, getWidgetByName(node, 'vae_name_' + i), has_vae ? true : false)
            }
            for (let i = number_to_show; i < 11; i++) {
                ['ckpt_name_' + i, 'clip_skip_' + i, 'vae_name_' + i].map(name => toggleWidget(node, getWidgetByName(node, name), false))
            }
            updateNodeHeight(node)
            break
        case 'input_count':
            var number_to_show = v + 1
            var target_parameter = getWidgetByName(node, 'target_parameter').value
            for (let i = 0; i < number_to_show; i++) {
                toggleWidget(node, getWidgetByName(node, 'sampler_' + i), target_parameter !== 'scheduler' ? true : false);
                toggleWidget(node, getWidgetByName(node, 'scheduler_' + i), target_parameter !== 'sampler' ? true : false)
            }
            for (let i = number_to_show; i < 31; i++) {
                toggleWidget(node, getWidgetByName(node, 'sampler_' + i))
                toggleWidget(node, getWidgetByName(node, 'scheduler_' + i))
            }
            updateNodeHeight(node)
            break
        case 'input_mode':
            switch (node_name) {
                case 'easy XYInputs: Lora':
                    var number_to_show = getWidgetByName(node, 'lora_count').value + 1
                    const has_weight = v.indexOf("Weights") != -1
                    for (let i = 0; i < number_to_show; i++) {
                        toggleWidget(node, getWidgetByName(node, 'lora_name_' + i), true);
                        ['model_str_' + i, 'clip_str_' + i].map(name => toggleWidget(node, getWidgetByName(node, name), has_weight ? true : false))
                    }
                    ['model_strength', 'clip_strength'].map(name => toggleWidget(node, getWidgetByName(node, name), has_weight ? false : true))
                    break
                case 'easy XYInputs: Checkpoint':
                    var number_to_show = getWidgetByName(node, 'ckpt_count').value + 1
                    var has_clipskip = getWidgetByName(node, 'input_mode').value.indexOf("ClipSkip") != -1
                    var has_vae = getWidgetByName(node, 'input_mode').value.indexOf("VAE") != -1
                    for (let i = 0; i < number_to_show; i++) {
                        toggleWidget(node, getWidgetByName(node, 'ckpt_name_' + i), true);
                        toggleWidget(node, getWidgetByName(node, 'clip_skip_' + i), has_clipskip ? true : false);
                        toggleWidget(node, getWidgetByName(node, 'vae_name_' + i), has_vae ? true : false)
                    }
                    break
            }
            updateNodeHeight(node)
            break
        // Image
        case 'rem_mode':
            toggleWidget(node, getWidgetByName(node, 'torchscript_jit'), v === 'Inspyrenet' ? true : false)
            toggleWidget(node, getWidgetByName(node, 'refine_foreground'), v === 'BEN2' ? true : false)
            updateNodeHeight(node)
            break
    }
}
