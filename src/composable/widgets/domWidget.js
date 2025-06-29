import {toRaw} from "vue";
import {generateUUID} from "@/composable/utils/formatUtil.js";
import { useDomWidgetStore } from '@/stores/domWidgetStore'

export const isDOMWidget = (
    widget
) => 'element' in widget && !!widget.element
export const isComponentWidget = (
    widget
) => 'component' in widget && !!widget.component

class BaseDOMWidgetImpl {
    static DEFAULT_MARGIN = 10

    constructor(obj) {
        this.type = obj.type
        this.name = obj.name
        this.options = obj.options

        this.id = generateUUID()
        this.node = obj.node
        this.y = 0
    }

    get value() {
        return this.options.getValue?.() ?? ''
    }

    set value(v) {
        this.options.setValue?.(v)
        this.callback?.(this.value)
    }

    get margin() {
        return this.options.margin ?? BaseDOMWidgetImpl.DEFAULT_MARGIN
    }

    isVisible() {
        return !['hidden'].includes(this.type) && this.node.isWidgetVisible(this)
    }

    draw(
        ctx,
        _node,
        widget_width,
        y,
        widget_height,
        lowQuality
    ) {
        if (this.options.hideOnZoom && lowQuality && this.isVisible()) {
            // Draw a placeholder rectangle
            const originalFillStyle = ctx.fillStyle
            ctx.beginPath()
            ctx.fillStyle = LiteGraph.WIDGET_BGCOLOR
            ctx.rect(
                this.margin,
                y + this.margin,
                widget_width - this.margin * 2,
                (this.computedHeight ?? widget_height) - 2 * this.margin
            )
            ctx.fill()
            ctx.fillStyle = originalFillStyle
        }
        this.options.onDraw?.(this)
    }

    onRemove() {
        useDomWidgetStore().unregisterWidget(this.id)
    }
}

export class ComponentWidgetImpl extends BaseDOMWidgetImpl {
    constructor(obj) {
        super({
            ...obj,
            type: 'custom'
        })
        this.component = obj.component
        this.inputSpec = obj.inputSpec
    }

    computeLayoutSize() {
        const minHeight = this.options.getMinHeight?.() ?? 45
        const maxHeight = this.options.getMaxHeight?.() ?? 45
        return {
            minHeight,
            maxHeight,
            minWidth: 120
        }
    }

    serializeValue() {
        return toRaw(this.value)
    }
}