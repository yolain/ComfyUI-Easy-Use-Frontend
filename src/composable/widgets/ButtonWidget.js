import { BaseWidget } from "./BaseWidget"

export class ButtonWidget extends BaseWidget {
    constructor(widget, node) {
        super(widget, node)
        this.type = "button"
        this.clicked = this.clicked ?? false
    }

    /**
     * Draws the widget
     * @param {CanvasRenderingContext2D} ctx The canvas context
     * @param {Object} options The options for drawing the widget
     * @param {number} options.width 宽度
     * @param {boolean} [options.showText=true] 是否显示文本
     */
    drawWidget(ctx, {
        width,
        showText = true,
        isEasyUseTheme = false,
    }) {
        // Store original context attributes
        const { fillStyle, strokeStyle, textAlign } = ctx

        const { height, y } = this
        const { margin } = BaseWidget

        // Draw button background
        ctx.fillStyle = this.background_color
        if (this.clicked) {
            ctx.fillStyle = "#AAA"
            this.clicked = false
        }
        if(isEasyUseTheme)  {
            ctx.fillStyle = this.background_color
            ctx.beginPath()
            ctx.roundRect(margin, y, width - margin * 2, height, [height * 0.25]);
            ctx.fill()
        }
        else ctx.fillRect(margin, y, width - margin * 2, height)

        // Draw button outline if not disabled
        if (showText && !this.computedDisabled) {
            ctx.strokeStyle = this.outline_color
            if(isEasyUseTheme) ctx.stroke()
            else ctx.strokeRect(margin, y, width - margin * 2, height)
        }

        // Draw button text
        if (showText) this.drawLabel(ctx, width * 0.5)

        // Restore original context attributes
        Object.assign(ctx, { textAlign, strokeStyle, fillStyle })
    }

    /**
     * 绘制按钮标签
     * @param {CanvasRenderingContext2D} ctx 画布上下文
     * @param {number} x X坐标
     */
    drawLabel(ctx, x) {
        ctx.textAlign = "center"
        ctx.fillStyle = this.text_color
        ctx.fillText(this.displayName, x, this.y + this.height * 0.7)
    }

    /**
     * 点击事件处理
     * @param {Object} options 事件选项
     * @param {Event} options.e 原始事件对象
     * @param {Object} options.node 节点
     * @param {Object} options.canvas 画布
     */
    onClick({ e, node, canvas }) {
        const pos = canvas.graph_mouse

        // Set clicked state and mark canvas as dirty
        this.clicked = true
        canvas.setDirty(true)

        // Call the callback with widget instance and other context
        if (this.callback) {
            this.callback(this, canvas, node, pos, e)
        }
    }
}