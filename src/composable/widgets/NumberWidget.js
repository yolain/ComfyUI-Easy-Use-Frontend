import {BaseSteppedWidget} from "./BaseSteppedWidget.js"
import {getWidgetStep} from "../utils/widget.js"

export class NumberWidget extends BaseSteppedWidget {
    constructor(widget, node) {
        super(widget, node);
        this.type = "number";
    }

    get _displayValue() {
        return Number(this.value).toFixed(
            this.options.precision !== undefined
                ? this.options.precision
                : 3,
        )
    }

    canIncrement() {
        const {max} = this.options
        return max == null || this.value < max
    }

    canDecrement() {
        const {min} = this.options
        return min == null || this.value > min
    }

    incrementValue(options) {
        this.setValue(this.value + getWidgetStep(this.options), options)
    }

    decrementValue(options) {
        this.setValue(this.value - getWidgetStep(this.options), options)
    }

    setValue(value, options) {
        let newValue = value
        if (this.options.min != null && newValue < this.options.min) {
            newValue = this.options.min
        }
        if (this.options.max != null && newValue > this.options.max) {
            newValue = this.options.max
        }
        super.setValue(newValue, options)
    }

    onClick({e, node, canvas}) {
        const x = e.canvasX - node.pos[0]
        const width = this.width || node.size[0]

        // Determine if clicked on left/right arrows
        const delta = x < 40
            ? -1
            : (x > width - 40
                ? 1
                : 0)

        if (delta) {
            // Handle left/right arrow clicks
            this.setValue(this.value + delta * getWidgetStep(this.options), {e, node, canvas})
            return
        }

        // Handle center click - show prompt
        canvas.prompt("Value", this.value, (v) => {
            // Check if v is a valid equation or a number
            if (/^[\d\s()*+/-]+|\d+\.\d+$/.test(v)) {
                // Solve the equation if possible
                try {
                    v = eval(v)
                } catch {
                }
            }
            const newValue = Number(v)
            if (!isNaN(newValue)) {
                this.setValue(newValue, {e, node, canvas})
            }
        }, e)
    }

    /**
     * Handles drag events for the number widget
     * @param {object} options The options for handling the drag event
     */
    onDrag({e, node, canvas}) {
        const width = this.width || node.width
        const x = e.canvasX - node.pos[0]
        const delta = x < 40
            ? -1
            : (x > width - 40
                ? 1
                : 0)

        if (delta && (x > -3 && x < width + 3)) return
        this.setValue(this.value + (e.deltaX ?? 0) * getWidgetStep(this.options), {e, node, canvas})
    }
}