import {ClientUtilities} from "./client-utilities";
import {ErrorEnum} from "../both/error-enum";

const setErrors = {
    setErrors() {
        for (let key in this.errors.reason) {
            if (!this.errors.reason.hasOwnProperty(key)) continue;

            if (ClientUtilities.isObject(this.errors.reason[key])) {
                Object.assign(this.errorsForConsole, this.errors.reason[key]);
            } else {
                Object.assign(this.errorsForPanel, {[key]: this.errors.reason[key]});
                checkSpecialPanelErrors.checkSpecialPanelErrors(key, this.errorsForPanel);
            }
        }
    }
};

const checkSpecialPanelErrors = {
    checkSpecialPanelErrors(key, errorsForPanel) {
        if (key === ErrorEnum.userNotValidatedError.error)
            Object.assign(errorsForPanel, {showResendVerificationEmailButton: true});
    }
};

export default class ClientErrorHandling {

    errorsForPanel = {};
    errorsForConsole = {};

    constructor(errors, instance) {
        this.errors = errors;
        this.instance = instance;
    }

    handle() {
        setErrors.setErrors.call(this);
        this.instance.reactiveDict.set('errors', this.errorsForPanel);
        if (!ClientUtilities.isObjectEmpty(this.errorsForConsole))
            console.log(this.errorsForConsole);
    }

}