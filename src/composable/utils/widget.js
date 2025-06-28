export function getWidgetStep(options) {
    return options.step2 || ((options.step || 10) * 0.1)
}
export function clamp(value, min, max) {
    return value < min ? min : (value > max ? max : value)
}
const sentWarnings = new Set()
export function warnDeprecated(message, source = null){
    if (!LiteGraph.alwaysRepeatWarnings) {
        // Do not repeat
        if (sentWarnings.has(message)) return

        // Hard limit of unique messages per session
        if (sentWarnings.size > UNIQUE_MESSAGE_LIMIT) return
        sentWarnings.add(message)
    }

    for (const callback of LiteGraph.onDeprecationWarning) {
        callback(message, source)
    }
}