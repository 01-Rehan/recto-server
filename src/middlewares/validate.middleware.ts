import { NextFunction, Request, Response } from "express";
import { ZodObject, ZodError } from "zod";
import ApiResponse from "../utils/ApiResponse";

const validate =
  (schema: ZodObject<any, any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Only pass fields that the schema expects (avoid unnecessary objects)
      const parseInput: Record<string, any> = {};

      // Get schema shape to check what fields are defined
      const schemaShape = (schema as any)._shape || (schema as any).shape;

      if (schemaShape?.body) parseInput.body = req.body || {};
      if (schemaShape?.query) parseInput.query = req.query || {};
      if (schemaShape?.params) parseInput.params = req.params || {};
      if (schemaShape?.cookies) parseInput.cookies = req.cookies || {};
      if (schemaShape?.headers) parseInput.headers = req.headers || {};

      const result = schema.parse(parseInput);

      req.body = result.body || req.body;

      if (result.params) {
        Object.defineProperty(req, "params", {
          value: result.params,
          configurable: true,
          writable: true,
        });
      }

      if (result.query) {
        // Clear and assign (for strictness)
        for (const key in req.query) {
          delete (req.query as any)[key];
        }
        Object.assign(req.query, result.query);
      }

      next();
    } catch (error: any) {
      if (error instanceof ZodError) {
        res.status(400).json(new ApiResponse(400, error, "Validation Error"));
        return;
      }
      next(error);
    }
  };

export default validate;
