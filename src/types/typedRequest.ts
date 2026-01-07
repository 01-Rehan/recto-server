import { Request } from "express";
import { z } from "zod";

/**
 * Generic typed request that combines CustomRequest with validated types
 * Use with Zod schema inference for automatic type safety
 */
export interface TypedRequest<
  TBody = any,
  TParams = any,
  TQuery = any,
> extends Request<TParams, any, TBody, TQuery> {
  user?: {
    _id: string;
    email: string;
    role: string;
    userName: string;
    fullName: string;
    [key: string]: any;
  };
}

/**
 * Helper type to infer request types from a Zod validation schema
 * Usage: ValidatedRequest<typeof mySchema>
 */
export type ValidatedRequest<T extends z.ZodTypeAny> = TypedRequest<
  z.infer<T> extends { body: infer B } ? B : unknown,
  z.infer<T> extends { params: infer P } ? P : unknown,
  z.infer<T> extends { query: infer Q } ? Q : unknown
>;
