import fs from 'fs';
import swaggerUI from 'swagger-ui-express';
import createHttpError from 'http-errors';
import path from 'path';

const SWAGGER_PATH = path.resolve('docs', 'swagger.json');

export const createSwaggerDocs = (params) => {
  try {
    const swaggerDoc = JSON.parse(fs.readFileSync(SWAGGER_PATH).toString());
    return [...swaggerUI.serve, swaggerUI.setup(swaggerDoc)];
  } catch (error) {
    return (req, res, next) => {
      console.log(error);
      next(createHttpError(500, "Can't load swagger docs"));
    };
  }
};
