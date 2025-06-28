import { BaseWidget } from "./BaseWidget"

export class TextWidget extends BaseWidget {
    constructor(widget, node) {
        super(widget, node)
        this.type = this.type ?? "string"
        this.value = widget.value?.toString() ?? ""
    }

    /**
     * Draws the widget
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {Object} options The options for drawing the widget
     * @param {number} options.width
     * @param {boolean} [options.showText=true]
     */
    drawWidget(ctx, {
        width,
        showText = true,
        isEasyUseTheme = false,
    }) {
        // Store original context attributes
        const { fillStyle, strokeStyle, textAlign } = ctx

        this.drawWidgetShape(ctx, { width, showText, isEasyUseTheme })

        if (showText) {
            this.drawTruncatingText({ ctx, width, leftPadding: 0, rightPadding: 0, isEasyUseTheme })
        }

        // Restore original context attributes
        Object.assign(ctx, { textAlign, strokeStyle, fillStyle })
    }

    /**
     * @param {Object} options
     * @param {Event} options.e
     * @param {Object} options.node
     * @param {Object} options.canvas
     */
    onClick({ e, node, canvas }) {
        // Show prompt dialog for text input
        canvas.prompt(
            "Value",
            this.value,
            (v) => {
                if (v !== null) {
                    this.setValue(v, { e, node, canvas })
                }
            },
            e,
            this.options?.multiline ?? false,
        )
    }
}