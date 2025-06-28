import { BaseWidget } from "./BaseWidget.js"
import { clamp } from "../utils/widget.js"
import { THEME_COLOR } from "@/constants";

export class SliderWidget extends BaseWidget {
    constructor(widget, node) {
        super(widget, node);
        this.type = "slider";
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

        const { height, y } = this
        const { margin } = BaseWidget

        // Draw background
        ctx.fillStyle = this.background_color
        if(isEasyUseTheme){
            ctx.strokeStyle = this.outline_color
            ctx.beginPath();
            ctx.roundRect(margin, y, width - margin * 2, height, [height * 0.25]);
            ctx.fill();
            ctx.stroke();
        }else{
            ctx.fillRect(margin, y, width - margin * 2, height)
        }

        // Calculate normalized value
        const range = this.options.max - this.options.min
        let nvalue = (this.value - this.options.min) / range
        nvalue = clamp(nvalue, 0, 1)

        // Draw slider bar
        ctx.fillStyle = this.options.slider_color ?? THEME_COLOR
        if(isEasyUseTheme){
            ctx.beginPath();
            ctx.roundRect(margin, y, nvalue * (width - margin * 2), height, [height * 0.25]);
            ctx.fill();
        }
        else{
            ctx.fillRect(margin, y, nvalue * (width - margin * 2), height)
        }

        // Draw outline if not disabled
        if (showText && !this.computedDisabled) {
            ctx.strokeStyle = this.outline_color
            if(!isEasyUseTheme){
                ctx.strokeRect(margin, y, width - margin * 2, height)
            }
        }

        // Draw marker if present
        if (this.marker != null) {
            let marker_nvalue = (this.marker - this.options.min) / range
            marker_nvalue = clamp(marker_nvalue, 0, 1)
            ctx.fillStyle = this.options.marker_color ?? "#AA9"
            if(isEasyUseTheme){
                ctx.roundRect(
                    margin + marker_nvalue * (width - margin * 2),
                    y,
                    2,
                    height,
                    [height * 0.25]);
            }else{
                ctx.fillRect(
                    margin + marker_nvalue * (width - margin * 2),
                    y,
                    2,
                    height,
                )
            }

        }

        // Draw text
        if (showText) {
            ctx.textAlign = "center"
            ctx.fillStyle = this.text_color
            const fixedValue = Number(this.value).toFixed(this.options.precision ?? 3)
            ctx.fillText(
                `${this.label || this.name}  ${fixedValue}`,
                width * 0.5,
                y + height * 0.7,
            )
        }

        // Restore original context attributes
        Object.assign(ctx, { textAlign, strokeStyle, fillStyle })
    }

    /**
     * Handles click events for the slider widget
     * @param {Object} options Widget event options
     */
    onClick(options) {
        if (this.options.read_only) return

        const { e, node } = options
        const width = this.width || node.size[0]
        const x = e.canvasX - node.pos[0]

        // Calculate new value based on click position
        const slideFactor = clamp((x - 15) / (width - 30), 0, 1)
        const newValue = this.options.min + (this.options.max - this.options.min) * slideFactor

        if (newValue !== this.value) {
            this.setValue(newValue, options)
        }
    }

    /**
     * Handles drag events for the slider widget
     * @param {Object} options Widget event options
     * @returns {boolean}
     */
    onDrag(options) {
        if (this.options.read_only) return false

        const { e, node } = options
        const width = this.width || node.size[0]
        const x = e.canvasX - node.pos[0]

        // Calculate new value based on drag position
        const slideFactor = clamp((x - 15) / (width - 30), 0, 1)
        const newValue = this.options.min + (this.options.max - this.options.min) * slideFactor

        if (newValue !== this.value) {
            this.setValue(newValue, options)
        }
    }
}