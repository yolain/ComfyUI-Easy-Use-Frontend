/**
 * Draw a rounded rectangle
 * @param ctx
 * @param x
 * @param y
 * @param width
 * @param height
 * @param radius
 */
export function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

/**
 * Draw a circle
 * @param ctx
 * @param x
 * @param y
 * @param radius
 */
export function drawCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
}

/**
 * Draw a Text
 * @param ctx
 * @param text
 */
export function drawText(ctx, text, x, y, color = "#000", fontSize = 12, fontFamily = "Inter") {
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
}


const ELLIPSIS = "\u2026"
const TWO_DOT_LEADER = "\u2025"
const ONE_DOT_LEADER = "\u2024"
export const RenderShape = {
    /** Rectangle with square corners */
    BOX:1,
    /** Rounded rectangle */
    ROUND:2,
    /** Circle is circle */
    CIRCLE:3,
    /** Two rounded corners: top left & bottom right */
    CARD:4,
    /** Slot shape: Arrow */
    ARROW:5,
    /** Slot shape: Grid */
    GRID:6,
    /** Slot shape: Hollow circle  */
    HollowCircle:7,
}
export const SlotType = {
    Array: "array",
    Event: -1,
};

/** @see RenderShape */
export const SlotShape = {
    Box: 1,
    Arrow: 5,
    Grid: 6,
    Circle: 3,
    HollowCircle: 7,
};

/** @see LinkDirection */
export const SlotDirection = {
    Up: 1,
    Right: 4,
    Down:2,
    Left: 3,
};

export const LabelPosition = {
    Left: "left",
    Right: "right",
};
export function drawSlot(
    ctx,
    slot,
    pos,
    {
        label_color = "#AAA",
        label_position = LabelPosition.Right,
        horizontal = false,
        low_quality = false,
        render_text = true,
        do_stroke = false,
        highlight = false,
    } = {},
) {
    // Save the current fillStyle and strokeStyle
    const originalFillStyle = ctx.fillStyle
    const originalStrokeStyle = ctx.strokeStyle
    const originalLineWidth = ctx.lineWidth

    const slot_type = slot.type
    const slot_shape = (
        slot_type === SlotType.Array ? SlotShape.Grid : slot.shape
    )

    ctx.beginPath()
    let doStroke = do_stroke
    let doFill = true

    if (slot_type === SlotType.Event || slot_shape === SlotShape.Box) {
        if (horizontal) {
            ctx.rect(pos[0] - 5 + 0.5, pos[1] - 8 + 0.5, 10, 14)
        } else {
            ctx.rect(pos[0] - 6 + 0.5, pos[1] - 5 + 0.5, 14, 10)
        }
    } else if (slot_shape === SlotShape.Arrow) {
        ctx.moveTo(pos[0] + 8, pos[1] + 0.5)
        ctx.lineTo(pos[0] - 4, pos[1] + 6 + 0.5)
        ctx.lineTo(pos[0] - 4, pos[1] - 6 + 0.5)
        ctx.closePath()
    } else if (slot_shape === SlotShape.Grid) {
        const gridSize = 3
        const cellSize = 2
        const spacing = 3

        for (let x = 0; x < gridSize; x++) {
            for (let y = 0; y < gridSize; y++) {
                ctx.rect(
                    pos[0] - 4 + x * spacing,
                    pos[1] - 4 + y * spacing,
                    cellSize,
                    cellSize,
                )
            }
        }
        doStroke = false
    } else {
        // Default rendering for circle, hollow circle.
        if (low_quality) {
            ctx.rect(pos[0] - 4, pos[1] - 4, 8, 8)
        } else {
            let radius
            if (slot_shape === SlotShape.HollowCircle) {
                doFill = false
                doStroke = true
                ctx.lineWidth = 3
                ctx.strokeStyle = ctx.fillStyle
                radius = highlight ? 4 : 3
            } else {
                // Normal circle
                radius = highlight ? 5 : 4
            }
            ctx.arc(pos[0], pos[1], radius, 0, Math.PI * 2)
        }
    }

    if (doFill) ctx.fill()
    if (!low_quality && doStroke) ctx.stroke()

    // render slot label
    if (render_text) {
        const text = slot.label || slot.localized_name || slot.name
        if (text) {
            // TODO: Finish impl.  Highlight text on mouseover unless we're connecting links.
            ctx.fillStyle = label_color

            if (label_position === LabelPosition.Right) {
                if (horizontal || slot.dir == LinkDirection.UP) {
                    ctx.fillText(text, pos[0], pos[1] - 10)
                } else {
                    ctx.fillText(text, pos[0] + 10, pos[1] + 5)
                }
            } else {
                if (horizontal || slot.dir == LinkDirection.DOWN) {
                    ctx.fillText(text, pos[0], pos[1] - 8)
                } else {
                    ctx.fillText(text, pos[0] - 10, pos[1] + 5)
                }
            }
        }
    }

    // Restore the original fillStyle and strokeStyle
    ctx.fillStyle = originalFillStyle
    ctx.strokeStyle = originalStrokeStyle
    ctx.lineWidth = originalLineWidth
}

export function strokeShape(
    ctx,
    area,
    options = {},
) {
    // Don't deconstruct in function arguments. If deconstructed in the argument list, the defaults will be evaluated
    // once when the function is defined, and will not be re-evaluated when the function is called.
    const {
        shape = RenderShape.BOX,
        round_radius = LiteGraph.ROUND_RADIUS,
        title_height = LiteGraph.NODE_TITLE_HEIGHT,
        title_mode = LiteGraph.NORMAL_TITLE,
        color = LiteGraph.NODE_BOX_OUTLINE_COLOR,
        padding = 6,
        collapsed = false,
        thickness = 1,
    } = options


    // Adjust area if title is transparent
    if (title_mode === LiteGraph.TRANSPARENT_TITLE) {
        area[1] -= title_height
        area[3] += title_height
    }

    // Set up context
    const { lineWidth, strokeStyle } = ctx
    ctx.lineWidth = thickness
    ctx.globalAlpha = 0.8
    ctx.strokeStyle = color
    ctx.beginPath()

    // Draw shape based on type
    const [x, y, width, height] = area
    switch (shape) {
        case RenderShape.BOX: {
            ctx.rect(
                x - padding,
                y - padding,
                width + 2 * padding,
                height + 2 * padding,
            )
            break
        }
        case RenderShape.ROUND:
        case RenderShape.CARD: {
            const radius = round_radius + padding
            const isCollapsed = shape === RenderShape.CARD && collapsed
            const cornerRadii =
                isCollapsed || shape === RenderShape.ROUND
                    ? [radius]
                    : [radius, 2, radius, 2]
            ctx.roundRect(
                x - padding,
                y - padding,
                width + 2 * padding,
                height + 2 * padding,
                cornerRadii,
            )
            break
        }
        case RenderShape.CIRCLE: {
            const centerX = x + width / 2
            const centerY = y + height / 2
            const radius = Math.max(width, height) / 2 + padding
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
            break
        }
    }

    // Stroke the shape
    ctx.stroke()

    // Reset context
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeStyle

    // TODO: Store and reset value properly.  Callers currently expect this behaviour (e.g. muted nodes).
    ctx.globalAlpha = 1
}

/**
 * Truncates text using binary search to fit within a given width, appending an ellipsis if needed.
 * @param ctx The canvas rendering context.
 * @param text The text to truncate.
 * @param maxWidth The maximum width the text (plus ellipsis) can occupy.
 * @returns The truncated text, or the original text if it fits.
 */
function truncateTextToWidth(ctx, text, maxWidth) {
    if (!(maxWidth > 0)) return ""

    // Text fits
    const fullWidth = ctx.measureText(text).width
    if (fullWidth <= maxWidth) return text

    const ellipsisWidth = ctx.measureText(ELLIPSIS).width * 0.75

    // Can't even fit ellipsis
    if (ellipsisWidth > maxWidth) {
        const twoDotsWidth = ctx.measureText(TWO_DOT_LEADER).width * 0.75
        if (twoDotsWidth < maxWidth) return TWO_DOT_LEADER

        const oneDotWidth = ctx.measureText(ONE_DOT_LEADER).width * 0.75
        return oneDotWidth < maxWidth ? ONE_DOT_LEADER : ""
    }

    let min = 0
    let max = text.length
    let bestLen = 0

    // Binary search for the longest substring that fits with the ellipsis
    while (min <= max) {
        const mid = Math.floor((min + max) * 0.5)

        // Avoid measuring empty string + ellipsis
        if (mid === 0) {
            min = mid + 1
            continue
        }

        const sub = text.substring(0, mid)
        const currentWidth = ctx.measureText(sub).width + ellipsisWidth

        if (currentWidth <= maxWidth) {
            // This length fits, try potentially longer
            bestLen = mid
            min = mid + 1
        } else {
            // Too long, try shorter
            max = mid - 1
        }
    }

    return bestLen === 0
        ? ELLIPSIS
        : text.substring(0, bestLen) + ELLIPSIS
}

/**
 * Draws text within an area, truncating it and adding an ellipsis if necessary.
 */
export function drawTextInArea({ ctx, text, area, align = "left" }) {
    const { left, right, bottom, width, centreX } = area

    // Text already fits
    const fullWidth = ctx.measureText(text).width
    if (fullWidth <= width) {
        ctx.textAlign = align
        const x = align === "left" ? left : (align === "right" ? right : centreX)
        ctx.fillText(text, x, bottom)
        return
    }

    // Need to truncate text
    const truncated = truncateTextToWidth(ctx, text, width)
    if (truncated.length === 0) return

    // Draw text - left-aligned to prevent bouncing during resize
    ctx.textAlign = "left"
    ctx.fillText(truncated.slice(0, -1), left, bottom)
    ctx.rect(left, bottom, width, 1)

    // Draw the ellipsis, right-aligned to the button
    ctx.textAlign = "right"
    const ellipsis = truncated.at(-1)
    if (ellipsis) {
        ctx.fillText(ellipsis, right, bottom, ctx.measureText(ellipsis).width * 0.75);
    }
}