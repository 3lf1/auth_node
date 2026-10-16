export function formValidationErrors(details){
    return details.map((error) => ({
        field: error.path.join('.'),
        message: error.message
    }))
}

export function expiryToMilliseconds(expiry) {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if(!match) {
        throw new Error(`Invalid expiry format: ${expiry}`);
    }
    const [, amount, unit] = match;
    const multiplier = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return Number(amount) * multiplier[unit];
}

export function asyncHandler(fun){
    return function(req,res,next){
        Promise
            .resolve(fun(req,res,next))
            .catch(next)
    }
}