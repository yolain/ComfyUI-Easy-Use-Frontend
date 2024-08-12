/**
 * accAdd
 * @param {Number} arg1
 * @param {Number} arg2
 * @return {Number}
 */
export function accAdd(arg1, arg2) {
    let r1, r2, s1, s2,max;
    s1 = typeof arg1 == 'string' ? arg1 : arg1.toString()
    s2 = typeof arg2 == 'string' ? arg2 : arg2.toString()
    try { r1 = s1.split(".")[1].length } catch (e) { r1 = 0 }
    try { r2 = s2.split(".")[1].length } catch (e) { r2 = 0 }
    max = Math.pow(10, Math.max(r1, r2))
    return (arg1 * max + arg2 * max) / max
}
/**
 * accSub
 * @param {Number} arg1
 * @param {Number} arg2
 * @return {Number}
 */
export function accSub(arg1, arg2) {
    let r1, r2, max, min,s1,s2;
    s1 = typeof arg1 == 'string' ? arg1 : arg1.toString()
    s2 = typeof arg2 == 'string' ? arg2 : arg2.toString()
    try { r1 = s1.split(".")[1].length } catch (e) { r1 = 0 }
    try { r2 = s2.split(".")[1].length } catch (e) { r2 = 0 }
    max = Math.pow(10, Math.max(r1, r2));
    min = (r1 >= r2) ? r1 : r2;
    return ((arg1 * max - arg2 * max) / max).toFixed(min)
}
/**
 * accMul
 * @param {Number} arg1
 * @param {Number} arg2
 * @return {Number}
 */
export function accMul(arg1, arg2) {
    let max = 0, s1 =  typeof arg1 == 'string' ? arg1 : arg1.toString(), s2 = typeof arg2 == 'string' ? arg2 : arg2.toString();
    try { max += s1.split(".")[1].length } catch (e) { }
    try { max += s2.split(".")[1].length } catch (e) { }
    return Number(s1.replace(".", "")) * Number(s2.replace(".", "")) / Math.pow(10, max)
}
/**
 * accDiv
 * @param {Number} arg1
 * @param {Number} arg2
 * @return {Number}
 */
export function accDiv(arg1, arg2) {
    let t1 = 0, t2 = 0, r1, r2,s1 =  typeof arg1 == 'string' ? arg1 : arg1.toString(), s2 = typeof arg2 == 'string' ? arg2 : arg2.toString();
    try { t1 = s1.toString().split(".")[1].length } catch (e) { }
    try { t2 = s2.toString().split(".")[1].length } catch (e) { }
    r1 = Number(s1.toString().replace(".", ""))
    r2 = Number(s2.toString().replace(".", ""))
    return (r1 / r2) * Math.pow(10, t2 - t1)
}
Number.prototype.div = function (arg) {
    return accDiv(this, arg);
}