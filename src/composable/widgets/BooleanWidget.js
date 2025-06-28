import { BaseWidget } from "./BaseWidget"
import { THEME_COLOR } from "@/constants";

export class BooleanWidget extends BaseWidget {
    constructor(options) {
        super(options);
        this.type = "toggle";
    }

    drawWidget(ctx, {
        width,
        showText = true,
        isEasyUseTheme = false,
    }) {
        const { height, y } = this;
        const { margin } = BaseWidget;

        this.drawWidgetShape(ctx, { width, showText, isEasyUseTheme});

        ctx.fillStyle = this.value ? THEME_COLOR : "#333";
        ctx.beginPath();
        ctx.arc(
            width - margin * 2 + (isEasyUseTheme ? 4 : 0),
            y + height * 0.5,
            height * (isEasyUseTheme ? 0.25 : 0.36),
            0,
            Math.PI * 2,
        );
        ctx.fill();

        if (showText) {
            this.drawLabel(ctx, margin * 2 - (isEasyUseTheme ? 8 : 0));
            this.drawValue(ctx, width - (isEasyUseTheme ? 36 : 40));
        }
    }

    drawLabel(ctx, x) {
        // Draw label
        ctx.fillStyle = this.secondary_text_color;
        const { displayName } = this;
        if (displayName) ctx.fillText(displayName, x, this.labelBaseline);
    }

    drawValue(ctx, x) {
        // Draw value
        ctx.fillStyle = this.value ? this.text_color : this.secondary_text_color;
        ctx.textAlign = "right";
        const value = this.value ? this.options.on || "true" : this.options.off || "false";
        ctx.fillText(value, x, this.labelBaseline);
    }

    onClick(options) {
        this.setValue(!this.value, options);
    }
}