import { BaseWidget } from "./BaseWidget"

/**
 * Wraps a legacy POJO custom widget, so that all widgets may be called via the same internal interface.
 *
 * Support will eventually be removed.
 * @remarks Expect this class to undergo breaking changes without warning.
 */
export class LegacyWidget extends BaseWidget {
    /**
     * Draw the widget
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {object} node - LGraph node
     * @param {number} widget_width - Width of widget
     * @param {number} y - Y position
     * @param {number} H - Height
     * @param {boolean} [lowQuality] - Low quality flag
     */
    draw(ctx, node, widget_width, y, H, lowQuality) {
        // Implementation to be provided by extending class
    }

    drawWidget(ctx, options) {
        const H = LiteGraph.NODE_WIDGET_HEIGHT
        if (this.draw) {
            this.draw(ctx, this.node, options.width, this.y, H, !!options.showText)
        }
    }

    onClick() {
        console.warn("Custom widget wrapper onClick was just called. Handling for third party widgets is done via LGraphCanvas - the mouse callback.")
    }
}