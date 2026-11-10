import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const gstinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Enter a valid 15-character GSTIN"
  );

export const optionalGstinSchema = z
  .union([gstinSchema, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

export const panSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Enter a valid 10-character PAN");

export const optionalPanSchema = z
  .union([panSchema, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

export const pinSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code");

export const optionalPinSchema = z
  .union([pinSchema, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));
