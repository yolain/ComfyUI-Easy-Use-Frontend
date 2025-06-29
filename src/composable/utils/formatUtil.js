/**
 * Generates a RFC4122 compliant UUID v4 using the native crypto API when available
 * @returns {string} A properly formatted UUID string
 */
export const generateUUID = () => {
    // Use native crypto.randomUUID() if available (modern browsers)
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return crypto.randomUUID()
    }

    // Fallback implementation for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

const hasAnnotation = (filepath) =>
    /\[(input|output|temp)\]/i.test(filepath)

const createAnnotation = (filepath, rootFolder = 'input') =>
    !hasAnnotation(filepath) && rootFolder !== 'input' ? ` [${rootFolder}]` : ''

const createPath = (filename, subfolder = '') =>
    subfolder ? `${subfolder}/${filename}` : filename

/** Creates annotated filepath in format used by folder_paths.py */
export function createAnnotatedPath(
    item,
    options = {}
) {
    const { rootFolder = 'input', subfolder } = options
    if (typeof item === 'string')
        return `${createPath(item, subfolder)}${createAnnotation(item, rootFolder)}`
    return `${createPath(item.filename ?? '', item.subfolder)}${
        item.type ? createAnnotation(item.type, rootFolder) : ''
    }`
}

/**
 * Parses a filepath into its filename and subfolder components.
 *
 * @example
 * parseFilePath('folder/file.txt')    // → { filename: 'file.txt', subfolder: 'folder' }
 * parseFilePath('/folder/file.txt')   // → { filename: 'file.txt', subfolder: 'folder' }
 * parseFilePath('file.txt')           // → { filename: 'file.txt', subfolder: '' }
 * parseFilePath('folder//file.txt')   // → { filename: 'file.txt', subfolder: 'folder' }
 *
 * @param filepath The filepath to parse
 * @returns Object containing filename and subfolder
 */
export function parseFilePath(filepath) {
        if (!filepath?.trim()) return { filename: '', subfolder: '' }

        const normalizedPath = filepath
            .replace(/[\\/]+/g, '/') // Normalize path separators
            .replace(/^\//, '') // Remove leading slash
            .replace(/\/$/, '') // Remove trailing slash

        const lastSlashIndex = normalizedPath.lastIndexOf('/')

        if (lastSlashIndex === -1) {
            return {
                filename: normalizedPath,
                subfolder: ''
            }
        }

        return {
            filename: normalizedPath.slice(lastSlashIndex + 1),
            subfolder: normalizedPath.slice(0, lastSlashIndex)
        }
    }

export function useValueTransform(
    transform,
    initialValue
) {
    let internalValue = initialValue
    let cachedValue = transform(initialValue)
    let isChanged = false

    return {
        get: () => {
            if (!isChanged) return cachedValue
            cachedValue = transform(internalValue)
            return cachedValue
        },
        set: (value) => {
            isChanged = true
            internalValue = value
        }
    }
}

export function isBase64(str) {
    // 移除可能的Data URL前缀
    const base64String = str.replace(/^data:image\/\w+;base64,/, '');

    // Base64正则表达式
    const base64Regex = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/;

    // 检查长度是否为4的倍数且符合Base64字符集
    return base64String.length % 4 === 0 && base64Regex.test(base64String);
}

export const isURL = str => {
    if (!str) return false;
    return str.startsWith('http://') || str.startsWith('https://');
}