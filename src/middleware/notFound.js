import AppError from "../errors/appError.js";
import ErrorCodes from "../errors/errorCodes.js";

const notFound = (req, res, next) => {
  next(
    new AppError(
      "Route not found",
      404,
      ErrorCodes.ROUTE_NOT_FOUND
    )
  );
};

export default notFound;