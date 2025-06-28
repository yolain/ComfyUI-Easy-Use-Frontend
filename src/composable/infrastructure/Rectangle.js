export function isInRectangle(
    x,
    y,
    left,
    top,
    width,
    height,
) {
    return x >= left &&
        x < left + width &&
        y >= top &&
        y < top + height
}

/**
 * A rectangle, represented as a float64 array of 4 numbers: [x, y, width, height].
 *
 * This class is a subclass of Float64Array, and so has all the methods of that class.  Notably,
 * {@link Rectangle.from} can be used to convert a {@link ReadOnlyRect}.
 *
 * Sub-array properties ({@link Float64Array.subarray}):
 * - {@link pos}: The position of the top-left corner of the rectangle.
 * - {@link size}: The size of the rectangle.
 */
export class Rectangle extends Float64Array {

    #pos
    #size

    constructor(x = 0, y = 0, width = 0, height = 0) {
        super(4)

        this[0] = x
        this[1] = y
        this[2] = width
        this[3] = height
    }

    subarray(begin = 0, end) {
        const byteOffset = begin << 3
        const length = end === undefined ? end : end - begin
        return new Float64Array(this.buffer, byteOffset, length)
    }

    /**
     * A reference to the position of the top-left corner of this rectangle.
     *
     * Updating the values of the returned object will update this rectangle.
     */
    get pos() {
        this.#pos ??= this.subarray(0, 2)
        return this.#pos
    }

    set pos(value) {
        this[0] = value[0]
        this[1] = value[1]
    }

    /**
     * A reference to the size of this rectangle.
     *
     * Updating the values of the returned object will update this rectangle.
     */
    get size() {
        this.#size ??= this.subarray(2, 4)
        return this.#size
    }

    set size(value) {
        this[2] = value[0]
        this[3] = value[1]
    }

    // #region Property accessors
    /** The x co-ordinate of the top-left corner of this rectangle. */
    get x() {
        return this[0]
    }

    set x(value) {
        this[0] = value
    }

    /** The y co-ordinate of the top-left corner of this rectangle. */
    get y() {
        return this[1]
    }

    set y(value) {
        this[1] = value
    }

    /** The width of this rectangle. */
    get width() {
        return this[2]
    }

    set width(value) {
        this[2] = value
    }

    /** The height of this rectangle. */
    get height() {
        return this[3]
    }

    set height(value) {
        this[3] = value
    }

    /** The x co-ordinate of the left edge of this rectangle. */
    get left() {
        return this[0]
    }

    set left(value) {
        this[0] = value
    }

    /** The y co-ordinate of the top edge of this rectangle. */
    get top() {
        return this[1]
    }

    set top(value) {
        this[1] = value
    }

    /** The x co-ordinate of the right edge of this rectangle. */
    get right() {
        return this[0] + this[2]
    }

    set right(value) {
        this[0] = value - this[2]
    }

    /** The y co-ordinate of the bottom edge of this rectangle. */
    get bottom() {
        return this[1] + this[3]
    }

    set bottom(value) {
        this[1] = value - this[3]
    }

    /** The x co-ordinate of the centre of this rectangle. */
    get centreX() {
        return this[0] + (this[2] * 0.5)
    }

    /** The y co-ordinate of the centre of this rectangle. */
    get centreY() {
        return this[1] + (this[3] * 0.5)
    }

    // #endregion Property accessors

    /**
     * Updates the rectangle to the values of {@link rect}.
     * @param rect The rectangle to update to.
     */
    updateTo(rect) {
        this[0] = rect[0]
        this[1] = rect[1]
        this[2] = rect[2]
        this[3] = rect[3]
    }

    /**
     * Checks if the point [{@link x}, {@link y}] is inside this rectangle.
     * @param x The x-coordinate to check
     * @param y The y-coordinate to check
     * @returns `true` if the point is inside this rectangle, otherwise `false`.
     */
    containsXy(x, y) {
        const {x: left, y: top, width, height} = this
        return x >= left &&
            x < left + width &&
            y >= top &&
            y < top + height
    }

    /**
     * Checks if {@link point} is inside this rectangle.
     * @param point The point to check
     * @returns `true` if {@link point} is inside this rectangle, otherwise `false`.
     */
    containsPoint(point) {
        return this.x <= point[0] &&
            this.y <= point[1] &&
            this.x + this.width >= point[0] &&
            this.y + this.height >= point[1]
    }

    /**
     * Checks if {@link rect} is inside this rectangle.
     * @param rect The rectangle to check
     * @returns `true` if {@link rect} is inside this rectangle, otherwise `false`.
     */
    containsRect(rect) {
        return this.x <= rect[0] &&
            this.y <= rect[1] &&
            this.x + this.width >= rect[0] + rect[2] &&
            this.y + this.height >= rect[1] + rect[3]
    }

    /**
     * Checks if {@link rect} overlaps with this rectangle.
     * @param rect The rectangle to check
     * @returns `true` if {@link rect} overlaps with this rectangle, otherwise `false`.
     */
    overlaps(rect) {
        return this.x < rect[0] + rect[2] &&
            this.y < rect[1] + rect[3] &&
            this.x + this.width > rect[0] &&
            this.y + this.height > rect[1]
    }

    /**
     * Finds the corner (if any) of this rectangle that contains the point [{@link x}, {@link y}].
     * @param x The x-coordinate to check
     * @param y The y-coordinate to check
     * @param cornerSize Each corner is treated as an inset square with this width and height.
     * @returns The compass direction of the corner that contains the point, or `undefined` if the point is not in any corner.
     */
    findContainingCorner(x, y, cornerSize) {
        if (this.isInTopLeftCorner(x, y, cornerSize)) return "NW"
        if (this.isInTopRightCorner(x, y, cornerSize)) return "NE"
        if (this.isInBottomLeftCorner(x, y, cornerSize)) return "SW"
        if (this.isInBottomRightCorner(x, y, cornerSize)) return "SE"
    }

    /** @returns `true` if the point [{@link x}, {@link y}] is in the top-left corner of this rectangle, otherwise `false`. */
    isInTopLeftCorner(x, y, cornerSize) {
        return isInRectangle(x, y, this.x, this.y, cornerSize, cornerSize)
    }

    /** @returns `true` if the point [{@link x}, {@link y}] is in the top-right corner of this rectangle, otherwise `false`. */
    isInTopRightCorner(x, y, cornerSize) {
        return isInRectangle(x, y, this.right - cornerSize, this.y, cornerSize, cornerSize)
    }

    /** @returns `true` if the point [{@link x}, {@link y}] is in the bottom-left corner of this rectangle, otherwise `false`. */
    isInBottomLeftCorner(x, y, cornerSize) {
        return isInRectangle(x, y, this.x, this.bottom - cornerSize, cornerSize, cornerSize)
    }

    /** @returns `true` if the point [{@link x}, {@link y}] is in the bottom-right corner of this rectangle, otherwise `false`. */
    isInBottomRightCorner(x, y, cornerSize) {
        return isInRectangle(x, y, this.right - cornerSize, this.bottom - cornerSize, cornerSize, cornerSize)
    }

    /** @returns `true` if the point [{@link x}, {@link y}] is in the top edge of this rectangle, otherwise `false`. */
    isInTopEdge(x, y, edgeSize) {
        return isInRectangle(x, y, this.x, this.y, this.width, edgeSize)
    }

    /** @returns `true` if the point [{@link x}, {@link y}] is in the bottom edge of this rectangle, otherwise `false`. */
    isInBottomEdge(x, y, edgeSize) {
        return isInRectangle(x, y, this.x, this.bottom - edgeSize, this.width, edgeSize)
    }

    /** @returns `true` if the point [{@link x}, {@link y}] is in the left edge of this rectangle, otherwise `false`. */
    isInLeftEdge(x, y, edgeSize) {
        return isInRectangle(x, y, this.x, this.y, edgeSize, this.height)
    }

    /** @returns `true` if the point [{@link x}, {@link y}] is in the right edge of this rectangle, otherwise `false`. */
    isInRightEdge(x, y, edgeSize) {
        return isInRectangle(x, y, this.right - edgeSize, this.y, edgeSize, this.height)
    }

    /** @returns The centre point of this rectangle, as a new array. */
    getCentre() {
        return [this.centreX, this.centreY]
    }

    /** @returns The area of this rectangle. */
    getArea() {
        return this.width * this.height
    }

    /** @returns The perimeter of this rectangle. */
    getPerimeter() {
        return 2 * (this.width + this.height)
    }

    /** @returns The top-left corner of this rectangle, as a new array. */
    getTopLeft() {
        return [this[0], this[1]]
    }

    /** @returns The bottom-right corner of this rectangle, as a new array. */
    getBottomRight() {
        return [this.right, this.bottom]
    }

    /** @returns The width and height of this rectangle, as a new array. */
    getSize() {
        return [this[2], this[3]]
    }

    /** @returns The offset from the top-left of this rectangle to the point, as a new array. */
    getOffsetTo([x, y]) {
        return [x - this[0], y - this[1]]
    }

    /** @returns The offset from the point to the top-left of this rectangle, as a new array. */
    getOffsetFrom([x, y]) {
        return [this[0] - x, this[1] - y]
    }

    /** Resizes the rectangle without moving it, setting its top-left corner to [{@link x}, {@link y}]. */
    resizeTopLeft(x1, y1) {
        this[2] += this[0] - x1
        this[3] += this[1] - y1

        this[0] = x1
        this[1] = y1
    }

    /** Resizes the rectangle without moving it, setting its bottom-left corner to [{@link x}, {@link y}]. */
    resizeBottomLeft(x1, y2) {
        this[2] += this[0] - x1
        this[3] = y2 - this[1]

        this[0] = x1
    }

    /** Resizes the rectangle without moving it, setting its top-right corner to [{@link x}, {@link y}]. */
    resizeTopRight(x2, y1) {
        this[2] = x2 - this[0]
        this[3] += this[1] - y1

        this[1] = y1
    }

    /** Resizes the rectangle without moving it, setting its bottom-right corner to [{@link x}, {@link y}]. */
    resizeBottomRight(x2, y2) {
        this[2] = x2 - this[0]
        this[3] = y2 - this[1]
    }

    /** Sets the width without moving the right edge (changes position) */
    setWidthRightAnchored(width) {
        const currentWidth = this[2]
        this[2] = width
        this[0] += currentWidth - width
    }

    /** Sets the height without moving the bottom edge (changes position) */
    setHeightBottomAnchored(height) {
        const currentHeight = this[3]
        this[3] = height
        this[1] += currentHeight - height
    }

    /** Alias of {@link export}. */
    toArray() {
        return this.export()
    }

    /** @returns A new, untyped array (serializable) containing the values of this rectangle. */
    export() {
        return [this[0], this[1], this[2], this[3]]
    }

    /** Draws a debug outline of this rectangle. */
    _drawDebug(ctx, colour = "red") {
        const {strokeStyle, lineWidth} = ctx
        try {
            ctx.strokeStyle = colour
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.strokeRect(this[0], this[1], this[2], this[3])
        } finally {
            ctx.strokeStyle = strokeStyle
            ctx.lineWidth = lineWidth
        }
    }
}