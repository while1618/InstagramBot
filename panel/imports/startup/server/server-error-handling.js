import {ServerUtilities} from "./server-utilities";

export const ServerErrorHandling = class {

    static tryCatchHandler(checkFunction, parameters, errors) {
        try {
            checkFunction(...parameters);
        } catch (exception) {
            if (!exception.error)
                throw exception;
            errors[exception.error] = exception.reason;
        }
    }

    static throwExceptionIfErrorOccurred(errors, errorType) {
        if (!ServerUtilities.isObjectEmpty(errors))
            throw new Meteor.Error(errorType, errors);
    }

};