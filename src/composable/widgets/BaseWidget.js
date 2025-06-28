import { drawTextInArea } from "@/composable/canvas.js"
import { Rectangle } from "@/composable/infrastructure/Rectangle.js"


export class BaseWidget {
    /** From node edge to widget edge */
    static margin = 15
    /** From widget edge to tip of arrow button */
    static arrowMargin = 6
    /** Arrow button width */
    static arrowWidth = 10
    /** Absolute minimum display width of widget values */
    static minValueWidth = 42
    /** Minimum gap between label and value */
    static labelValueGap = 5

    #node;
    /** The node that this widget belongs to. */
    get node() {
        return this.#node
    }

    #value;
    get value() {
        return this.#value
    }

    set value(value) {
        this.#value = value
    }

    constructor(widget, node) {
        // 处理不同的构造函数调用形式
        if (node === undefined) {
            node = widget.node;
        }
        // 私有字段
        this.#node = node;
        this.#value = widget.value;

        // 属性设置
        this.name = widget.name;
        this.options = widget.options;
        this.type = widget.type;
        this.y = 0;

        // 避免命名冲突
        const { node: _, outline_color, background_color, height, text_color,
                secondary_text_color, disabledTextColor, displayName, displayValue,
                labelBaseline, ...safeValues } = widget;

        Object.assign(this, safeValues);
    }

    get outline_color() {
        return this.advanced ? LiteGraph.WIDGET_ADVANCED_OUTLINE_COLOR : LiteGraph.WIDGET_OUTLINE_COLOR;
    }

    get background_color() {
        return LiteGraph.WIDGET_BGCOLOR;
    }

    get height() {
        return LiteGraph.NODE_WIDGET_HEIGHT;
    }

    get text_color() {
        return LiteGraph.WIDGET_TEXT_COLOR;
    }

    get secondary_text_color() {
        return LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
    }

    get disabledTextColor() {
        return LiteGraph.WIDGET_DISABLED_TEXT_COLOR;
    }

    get displayName() {
        return this.label || this.name;
    }

    get _displayValue() {
        return String(this.value);
    }

    get labelBaseline() {
        return this.y + this.height * 0.7;
    }

    /**
     * 绘制标准控件形状 - 细长的胶囊形状
     * @param {CanvasRenderingContext2D} ctx 画布上下文
     * @param {Object} options 绘制选项
     */
     drawWidgetShape(ctx, { width, showText, isEasyUseTheme }) {
        const { height, y } = this;
        const { margin } = BaseWidget;

        ctx.textAlign = "left";
        ctx.strokeStyle = this.outline_color;
        ctx.fillStyle = this.background_color;
        ctx.beginPath();

        if (showText) {
            if(isEasyUseTheme) ctx.roundRect(margin, y, width - margin * 2, height, [height * 0.25]);
            else ctx.roundRect(margin, y, width - margin * 2, height, [height * 0.5]);
        } else {
            ctx.rect(margin, y, width - margin * 2, height);
        }
        ctx.fill();
        if (showText && !this.computedDisabled) ctx.stroke();
    }

    /**
     * 绘制文本，如果超出可用宽度则截断
     */
    drawTruncatingText({
        ctx,
        width,
        leftPadding = 5,
        rightPadding = 20,
        isEasyUseTheme,
    }) {
        const { height, y } = this;
        const { margin } = BaseWidget;

        // 测量标签和值的宽度
        const { displayName, _displayValue } = this;
        const labelWidth = ctx.measureText(displayName).width;
        const valueWidth = ctx.measureText(_displayValue).width;

        const gap = BaseWidget.labelValueGap;
        const x = margin * 2 + (isEasyUseTheme ? (leftPadding ? 2 : -8 ): leftPadding);

        const totalWidth = width - x - 2 * margin - (isEasyUseTheme ? 4 : rightPadding);
        const requiredWidth = labelWidth + gap + valueWidth;

        const area = new Rectangle(x, y, totalWidth, height * 0.7);

        // 如果启用EasyUse主题，则使用更小的字体
        if(isEasyUseTheme){
            ctx.font = "11px Inter"
        }
        ctx.fillStyle = this.secondary_text_color;

        if (requiredWidth <= totalWidth) {
            // 正常绘制标签和值
            drawTextInArea({ ctx, text: displayName, area, align: "left" });
        } else if (LiteGraph.truncateWidgetTextEvenly) {
            // 标签+值不适合 - 均匀缩放以适应
            const scale = (totalWidth - gap) / (requiredWidth - gap);
            area.width = labelWidth * scale;

            drawTextInArea({ ctx, text: displayName, area, align: "left" });

            // 将区域向右移动以渲染值
            area.right = x + totalWidth;
            area.setWidthRightAnchored(valueWidth * scale);
        } else if (LiteGraph.truncateWidgetValuesFirst) {
            // 标签+值不适合 - 先缩放值的旧方法
            const cappedLabelWidth = Math.min(labelWidth, totalWidth);

            area.width = cappedLabelWidth;
            drawTextInArea({ ctx, text: displayName, area, align: "left" });

            area.right = x + totalWidth;
            area.setWidthRightAnchored(Math.max(totalWidth - gap - cappedLabelWidth, 0));
        } else {
            // 标签+值不适合 - 先缩放标签
            const cappedValueWidth = Math.min(valueWidth, totalWidth);

            area.width = Math.max(totalWidth - gap - cappedValueWidth, 0);
            drawTextInArea({ ctx, text: displayName, area, align: "left" });

            area.right = x + totalWidth;
            area.setWidthRightAnchored(cappedValueWidth);
        }
        ctx.fillStyle = this.text_color;
        drawTextInArea({ ctx, text: _displayValue, area, align: "right" });
    }
    /**
     * 设置控件的值
     */
    setValue(value, { e, node, canvas }) {
        const oldValue = this.value;
        if (value === this.value) return;

        const v = this.type === "number" ? Number(value) : value;
        this.value = v;
        if (
            this.options?.property &&
            node.properties[this.options.property] !== undefined
        ) {
            node.setProperty(this.options.property, v);
        }
        const pos = canvas.graph_mouse;
        if (this.callback) {
            this.callback(this.value, canvas, node, pos, e);
        }

        if (node.onWidgetChanged) {
            node.onWidgetChanged(this.name ?? "", v, oldValue, this);
        }
        if (node.graph) node.graph._version++;
    }
}