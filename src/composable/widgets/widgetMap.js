import { BaseWidget } from "./BaseWidget.js";
import { ButtonWidget } from "./ButtonWidget.js";
import { BooleanWidget } from "./BooleanWidget.js";
import { SliderWidget } from "./SliderWidget.js";
import { KnobWidget } from "./KnobWidget.js";
import { ComboWidget } from "./ComboWidget.js";
import { NumberWidget } from "./NumberWidget.js";
import { TextWidget } from "./TextWidget.js";
import { LegacyWidget } from "./LegacyWidget.js";

export function toClass(cls, ...args) {
    return args[0] instanceof cls ? args[0] : new cls(...args);
}

export function toConcreteWidget(widget, node, wrapLegacyWidgets = true) {
    if (widget instanceof BaseWidget) return widget

    // 去除TypeScript类型相关代码
    // 因为JavaScript没有类型系统，所以直接使用原始widget对象
    const narrowedWidget = widget

    switch (narrowedWidget.type) {
        case "button": return toClass(ButtonWidget, narrowedWidget, node)
        case "toggle": return toClass(BooleanWidget, narrowedWidget, node)
        case "slider": return toClass(SliderWidget, narrowedWidget, node)
        case "knob": return toClass(KnobWidget, narrowedWidget, node)
        case "combo": return toClass(ComboWidget, narrowedWidget, node)
        case "number": return toClass(NumberWidget, narrowedWidget, node)
        case "string": return toClass(TextWidget, narrowedWidget, node)
        case "text": return toClass(TextWidget, narrowedWidget, node)
        default: {
            if (wrapLegacyWidgets) return toClass(LegacyWidget, widget, node)
        }
    }
}