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