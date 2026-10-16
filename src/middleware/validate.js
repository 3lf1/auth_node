import AppError from "../utils/appError.js";
import ErrorCodes from "../utils/errorCodes.js";
import formValidationErrors from "../utils/helperFunctions.js";

const validSources = ["body", "query", "params"];

export default function validate(schema, source = "body"){
    if(!validSources.includes(source)){
        throw new Error(`Invalid validation source: ${source}`)
    }

    return (req, res, next) => {
        const { error, value } = schema.validate(req[source],
            {
                abortEarly: false,
                stripUnknown: true,
            }
        )

        if(error){
            return next( new AppError(
                'Invalid request data',
                400,
                ErrorCodes.VALIDATION_ERROR,
                formValidationErrors(error.details)
            ))
        }

        req[source] = value;
        next();
    }
}