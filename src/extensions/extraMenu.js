import {app} from "@/composable/comfyAPI";
import {LoraInfoDialog, CheckpointInfoDialog} from "@/composable/model"
import {$t} from '@/composable/i18n.js'
import swap from "@/constants/swap.js";

// Replace node
function replaceNode(oldNode, newNodeName, type) {
    const newNode = LiteGraph.createNode(newNodeName);
    if (!newNode) {
        return;
    }
    app.graph.add(newNode);

    newNode.pos = oldNode.pos.slice();
    newNode.size = oldNode.size.slice();

    if(oldNode.widgets?.length>0){
        oldNode.widgets.forEach(widget => {
            if(swap[type]?.['widget']?.[widget.name]){
                const newName = swap[type]['widget'][widget.name];
                if (newName && newNode.widgets) {
                    const newWidget = findWidgetByName(newNode, newName);
                    if (newWidget) {
                        newWidget.value = widget.value;
                        if(widget.name == 'seed_num'){
                            newWidget.linkedWidgets[0].value = widget.linkedWidgets[0].value
                        }
                        if(widget.type == 'converted-widget'){
                            convertToInput(newNode, newWidget, widget);
                        }
                    }
                }
            }

        });
    }

    if(oldNode.inputs){
        oldNode.inputs.forEach((input, index) => {
            if (input && input.link && swap[type]?.['input']?.[input.name]) {
                const newInputName = swap[type]?.['input'][input.name];
                // If the new node does not have this output, skip
                if (newInputName === null) {
                    return;
                }
                const newInputIndex = newNode.findInputSlot(newInputName);
                if (newInputIndex !== -1) {
                    const originLinkInfo = oldNode.graph.links[input.link];
                    if (originLinkInfo) {
                        const originNode = oldNode.graph.getNodeById(originLinkInfo.origin_id);
                        if (originNode) {
                            originNode.connect(originLinkInfo.origin_slot, newNode, newInputIndex);
                        }
                    }
                }
            }
        });
    }

    if(oldNode.outputs){
        oldNode.outputs.forEach((output, index) => {
            if (output && output.links && swap[type]?.['output']?.[output.name]) {
                const newOutputName = swap[type]['output'][output.name];
                // If the new node does not have this output, skip
                if (newOutputName === null) {
                    return;
                }
                const newOutputIndex = newNode.findOutputSlot(newOutputName);
                if (newOutputIndex !== -1) {
                    output.links.forEach(link => {
                        const targetLinkInfo = oldNode.graph.links[link];
                        if (targetLinkInfo) {
                            const targetNode = oldNode.graph.getNodeById(targetLinkInfo.target_id);
                            if (targetNode) {
                                newNode.connect(newOutputIndex, targetNode, targetLinkInfo.target_slot);
                            }
                        }
                    });
                }
            }
        });
    }


    // Remove old node
    app.graph.remove(oldNode);

    // Remove others
    if(newNode.type == 'easy fullkSampler'){
        const link_output_id = newNode.outputs[0].links
        if(link_output_id && link_output_id[0]){
            const nodes = app.graph._nodes
            const node = nodes.find(cate=> cate.inputs && cate.inputs[0] &&  cate.inputs[0]['link'] == link_output_id[0])
            if(node){
                app.graph.remove(node);
            }
        }
    }else if(swap.preSampling.nodes.includes(newNode.type)){
        const link_output_id = newNode.outputs[0].links
        if(!link_output_id || !link_output_id[0]){
            const ksampler = LiteGraph.createNode('easy kSampler');
            app.graph.add(ksampler);
            ksampler.pos = newNode.pos.slice();
            ksampler.pos[0] = ksampler.pos[0] + newNode.size[0] + 20;
            const newInputIndex = newNode.findInputSlot('pipe');
            if (newInputIndex !== -1) {
                if (newNode) {
                    newNode.connect(0, ksampler, newInputIndex);
                }
            }
        }
    }
    // autoHeight
    newNode.setSize([newNode.size[0], newNode.computeSize()[1]]);
}

export function findWidgetByName(node, widgetName) {
    return node.widgets.find(widget => typeof widgetName == 'object' ? widgetName.includes(widget.name) : widget.name === widgetName);
}
function replaceNodeMenuCallback(currentNode, targetNodeName, type) {
    return function() {
        replaceNode(currentNode, targetNodeName, type);
    };
}
const addMenuHandler = (nodeType, cb)=> {
    const getOpts = nodeType.prototype.getExtraMenuOptions;
    nodeType.prototype.getExtraMenuOptions = function () {
        const r = getOpts.apply(this, arguments);
        cb.apply(this, arguments);
        return r;
    };
}
const addMenu = (content, type, nodes_include, nodeType, has_submenu=true) => {
    addMenuHandler(nodeType, function (_, options) {
        options.unshift({
            content: content,
            has_submenu: has_submenu,
            callback: (value, options, e, menu, node) => showSwapMenu(value, options, e, menu, node, type, nodes_include)
        })
        if(type == 'loaders') {
            options.unshift({
                content: $t("💎 View Lora Info..."),
                callback: (value, options, e, menu, node) => {
                    const widget = node.widgets.find(cate => cate.name == 'lora_name')
                    let name = widget.value;
                    if (!name || name == 'None') return
                    // todo: lora info
                    new LoraInfoDialog(name).show('loras', name);
                }
            })
            options.unshift({
                content: $t("💎 View Checkpoint Info..."),
                callback: (value, options, e, menu, node) => {
                    let name = node.widgets[0].value;
                    if (!name || name == 'None') return
                    // todo: checkpoint info
                    new CheckpointInfoDialog(name).show('checkpoints', name);
                }
            })
        }
    })
}
const showSwapMenu = (value, options, e, menu, node, type, nodes_include) => {
    const swapOptions = [];
    nodes_include.map(cate=>{
        if (node.type !== cate) {
            swapOptions.push({
                content: `${cate}`,
                callback: replaceNodeMenuCallback(node, cate, type)
            });
        }
    })
    new LiteGraph.ContextMenu(swapOptions, {
        event: e,
        callback: null,
        parentMenu: menu,
        node: node
    });
    return false;
}

// 重载节点
const CONVERTED_TYPE = "converted-widget";
const GET_CONFIG = Symbol();

function hideWidget(node, widget, suffix = "") {
    widget.origType = widget.type;
    widget.origComputeSize = widget.computeSize;
    widget.origSerializeValue = widget.serializeValue;
    widget.computeSize = () => [0, -4]; // -4 is due to the gap litegraph adds between widgets automatically
    widget.type = CONVERTED_TYPE + suffix;
    widget.serializeValue = () => {
        // Prevent serializing the widget if we have no input linked
        if (!node.inputs) {
            return undefined;
        }
        let node_input = node.inputs.find((i) => i.widget?.name === widget.name);

        if (!node_input || !node_input.link) {
            return undefined;
        }
        return widget.origSerializeValue ? widget.origSerializeValue() : widget.value;
    };

    // Hide any linked widgets, e.g. seed+seedControl
    if (widget.linkedWidgets) {
        for (const w of widget.linkedWidgets) {
            hideWidget(node, w, ":" + widget.name);
        }
    }
}
function convertToInput(node, widget, config) {
    hideWidget(node, widget);

    const { type } = getWidgetType(config);

    // Add input and store widget config for creating on primitive node
    const sz = node.size;
    if(!widget.options || !widget.options.forceInput){
        node.addInput(widget.name, type, {
            widget: { name: widget.name, [GET_CONFIG]: () => config },
        });
    }

    for (const widget of node.widgets) {
        widget.last_y += LiteGraph.NODE_SLOT_HEIGHT;
    }

    // Restore original size but grow if needed
    node.setSize([Math.max(sz[0], node.size[0]), Math.max(sz[1], node.size[1])]);
}

function getWidgetType(config) {
    // Special handling for COMBO so we restrict links based on the entries
    let type = config[0];
    if (type instanceof Array) {
        type = "COMBO";
    }
    return { type };
}

const reloadNode = function (node) {
    const nodeType = node.constructor.type;
    const origVals = node.properties?.origVals || {};

    const nodeTitle = origVals.title || node.title;
    const nodeColor = origVals.color || node.color;
    const bgColor = origVals.bgcolor || node.bgcolor;
    const graph = node.graph || app.graph;
    const options = {
        'size': [...node.size],
        'color': nodeColor,
        'bgcolor': bgColor,
        'pos': [...node.pos]
    };

    const getLink = (linkId) => graph.getLink?.(linkId) || graph.links?.get?.(linkId) || graph.links?.[linkId];
    const inputLinks = [];
    const outputLinks = [];
    const inputLabels = new Map(node.inputs?.map(input => [input.name, input.label]) || []);
    const outputLabels = new Map(node.outputs?.map(output => [output.name, output.label]) || []);
    const widgetValues = node.widgets?.map(widget => ({
        name: widget.name,
        type: widget.origType || widget.type,
        value: widget.value
    })) || [];
    const convertedWidgets = [];

    node.inputs?.forEach((input, inputSlot) => {
        if (input.link == null) return;
        const link = getLink(input.link);
        if (!link) return;
        const originNode = graph.getNodeById(link.origin_id);
        inputLinks.push({
            inputName: input.name,
            inputSlot,
            originId: link.origin_id,
            originName: originNode?.outputs?.[link.origin_slot]?.name,
            originSlot: link.origin_slot
        });
    });
    node.outputs?.forEach((output, outputSlot) => {
        for (const linkId of output.links || []) {
            const link = getLink(linkId);
            if (!link) continue;
            const targetNode = graph.getNodeById(link.target_id);
            outputLinks.push({
                outputName: output.name,
                outputSlot,
                targetId: link.target_id,
                targetName: targetNode?.inputs?.[link.target_slot]?.name,
                targetSlot: link.target_slot
            });
        }
    });
    node.widgets?.forEach(widget => {
        if (widget.type !== CONVERTED_TYPE) return;
        const input = node.inputs?.find(input => input.widget?.name === widget.name || input.name === widget.name);
        const config = input?.widget?.[GET_CONFIG]?.();
        if (config) convertedWidgets.push({name: widget.name, config});
    });

    const newNode = LiteGraph.createNode(nodeType, nodeTitle, options);
    if (!newNode) return;
    graph.remove(node);
    graph.add(newNode);

    const isValidWidgetValue = (widget, type, value) => {
        const widgetType = widget.origType || widget.type;
        if (widgetType !== type || value == null) return false;

        const rawValues = widget.options?.values;
        if (rawValues != null) {
            const values = typeof rawValues === "function" ? rawValues(widget, newNode) : rawValues;
            if (Array.isArray(values)) return values.includes(value);
            if (values && typeof values === "object") {
                return Object.prototype.hasOwnProperty.call(values, value)
                    || (Number.isInteger(value) && value >= 0 && value < Object.keys(values).length);
            }
            return false;
        }
        if (widgetType === "number" || widgetType === "slider") {
            if (typeof value !== "number" || !Number.isFinite(value)) return false;
            const min = widget.options?.min ?? -Infinity;
            const max = widget.options?.max ?? Infinity;
            return min <= value && value <= max;
        }
        if (typeof value === "number") {
            const min = widget.options?.min ?? -Infinity;
            const max = widget.options?.max ?? Infinity;
            return Number.isFinite(value) && min <= value && value <= max;
        }
        if (typeof value === "boolean") return widget.type === "toggle" || !!(widget.options?.on && widget.options?.off);
        return true;
    };

    // Dynamic combo inputs are created by the combo value setter. Restore valid
    // widgets in their original order so those inputs exist before reconnecting.
    // Invalid values deliberately keep the fresh node's default value.
    for (const {name, type, value} of widgetValues) {
        const widget = newNode.widgets?.find(newWidget => newWidget.name === name);
        if (widget && isValidWidgetValue(widget, type, value)) widget.value = value;
    }

    for (const {name, config} of convertedWidgets) {
        const widget = newNode.widgets?.find(newWidget => newWidget.name === name);
        if (widget) convertToInput(newNode, widget, config);
    }

    newNode.inputs?.forEach(input => {
        if (inputLabels.has(input.name)) input.label = inputLabels.get(input.name);
    });
    newNode.outputs?.forEach(output => {
        if (outputLabels.has(output.name)) output.label = outputLabels.get(output.name);
    });

    for (const {inputName, inputSlot, originId, originName, originSlot} of inputLinks) {
        const originNode = graph.getNodeById(originId);
        if (!originNode) continue;
        const sourceSlot = originNode.outputs?.[originSlot]?.name === originName
            ? originSlot
            : originNode.findOutputSlot(originName);
        const targetSlot = newNode.inputs?.[inputSlot]?.name === inputName
            ? inputSlot
            : newNode.findInputSlot(inputName);
        if (sourceSlot >= 0 && targetSlot >= 0) originNode.connect(sourceSlot, newNode, targetSlot);
    }
    for (const {outputName, outputSlot, targetId, targetName, targetSlot} of outputLinks) {
        const targetNode = graph.getNodeById(targetId);
        if (!targetNode) continue;
        const sourceSlot = newNode.outputs?.[outputSlot]?.name === outputName
            ? outputSlot
            : newNode.findOutputSlot(outputName);
        const newTargetSlot = targetNode.inputs?.[targetSlot]?.name === targetName
            ? targetSlot
            : targetNode.findInputSlot(targetName);
        if (sourceSlot >= 0 && newTargetSlot >= 0) newNode.connect(sourceSlot, targetNode, newTargetSlot);
    }

    newNode.setSize(options.size);
    newNode.setDirtyCanvas?.(true, true);
};

app.registerExtension({
    name: "Comfy.EasyUse.ExtraMenu",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        // 刷新节点
        addMenuHandler(nodeType, function (_, options) {
            options.unshift({
                content: $t("🔃 Reload Node"),
                callback: (value, options, e, menu, node) => {
                    let graphcanvas = LGraphCanvas.active_canvas;
                    if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1) {
                        reloadNode(node);
                    } else {
                        for (let i in graphcanvas.selected_nodes) {
                            reloadNode(graphcanvas.selected_nodes[i]);
                        }
                    }
                }
            })
            // ckptNames
            if(nodeData.name == 'easy ckptNames'){
                options.unshift({
                    content: $t("💎 View Checkpoint Info..."),
                    callback: (value, options, e, menu, node) => {
                        let name = node.widgets[0].value;
                        if (!name || name == 'None') return
                    }
                })
            }
        })

        for (const key in swap) {
            if (swap[key].nodes.includes(nodeData.name)) {
                addMenu(`↪️ Swap ${swap[key].category}`, key, swap[key].nodes, nodeType)
            }
        }
    }
});
