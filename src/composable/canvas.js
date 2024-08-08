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