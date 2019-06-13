export const ClientUtilities = class {

    static isObjectEmpty(obj) {
        return Object.keys(obj).length === 0 && obj.constructor === Object;
    }

    static isObject(variable) {
        return variable instanceof Object;
    }

};