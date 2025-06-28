import { BaseWidget } from "./BaseWidget";

/**
 * Base class for widgets that have increment and decrement buttons.
 */
export class BaseSteppedWidget extends BaseWidget {

    constructor(widget, node) {
        super(widget, node);
    }
    /**
     * Whether the widget can increment its value
     * @returns {boolean} `true` if the widget can increment its value, otherwise `false`
     */
    canIncrement() {
        // 子类需要实现此方法
        throw new Error('Method not implemented');
    }

    /**
     * Whether the widget can decrement its value
     * @returns {boolean} `true` if the widget can decrement its value, otherwise `false`
     */
    canDecrement() {
        // 子类需要实现此方法
        throw new Error('Method not implemented');
    }

    /**
     * Increment the value of the widget
     * @param {object} options The options for the widget event
     */
    incrementValue(options) {
        // 子类需要实现此方法
        throw new Error('Method not implemented');
    }

    /**
     * Decrement the value of the widget
     * @param {object} options The options for the widget event
     */
    decrementValue(options) {
        // 子类需要实现此方法
        throw new Error('Method not implemented');
    }

    /**
     * Draw the arrow buttons for the widget
     * @param {CanvasRenderingContext2D} ctx The canvas rendering context
     * @param {number} width The width of the widget
     */
    drawArrowButtons(ctx, width, isEasyUseTheme) {
        const { height, text_color, disabledTextColor, y } = this;
        const { arrowMargin, arrowWidth, margin } = BaseWidget;
        const arrowTipX = margin + arrowMargin + (isEasyUseTheme ? 2 : 0);
        const arrowInnerX = arrowTipX + arrowWidth;

        // Draw left arrow
        ctx.fillStyle = this.canDecrement() ? text_color : disabledTextColor;
        ctx.beginPath();

        const yOffset = isEasyUseTheme ? 6.5 : 5; // Adjust for easy use theme
        const xOffset = isEasyUseTheme ? -6 : 0; // Adjust for easy use theme
        ctx.moveTo(arrowInnerX + xOffset, y + yOffset);
        ctx.lineTo(arrowTipX + xOffset/2, y + height * 0.5);
        ctx.lineTo(arrowInnerX + xOffset, y + height - yOffset);
        ctx.fill();

        // Draw right arrow
        ctx.fillStyle = this.canIncrement() ? text_color : disabledTextColor;
        ctx.beginPath();
        ctx.moveTo(width - arrowInnerX- xOffset, y + yOffset);
        ctx.lineTo(width - arrowTipX - xOffset/2, y + height * 0.5);
        ctx.lineTo(width - arrowInnerX - xOffset, y + height - yOffset);
        ctx.fill();
    }

    /**
     * @override
     * @param {CanvasRenderingContext2D} ctx The canvas rendering context
     * @param {object} options The options for drawing the widget
     */
    drawWidget(ctx, options) {
        // Store original context attributes
        const { fillStyle, strokeStyle, textAlign } = ctx;

        this.drawWidgetShape(ctx, options);
        if (options.showText) {
            if (!this.computedDisabled) this.drawArrowButtons(ctx, options.width, options.isEasyUseTheme);

            this.drawTruncatingText({ ctx, width: options.width, isEasyUseTheme: options.isEasyUseTheme });
        }

        // Restore original context attributes
        Object.assign(ctx, { textAlign, strokeStyle, fillStyle });
    }
}