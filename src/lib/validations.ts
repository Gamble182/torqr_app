import { z } from 'zod';
// Type imports for future use
// import { EmailOptInStatus } from '@prisma/client';

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

/**
 * Email validation with proper format checking
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

/**
 * Password validation - strong password requirements
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be less than 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Phone number validation (flexible format)
 */
export const phoneSchema = z
  .string()
  .min(6, 'Phone number must be at least 6 characters')
  .max(20, 'Phone number must be less than 20 characters')
  .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format')
  .trim();

/**
 * Optional phone number
 */
export const optionalPhoneSchema = phoneSchema.optional().or(z.literal(''));

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid ID format');

/**
 * Non-empty string validation
 */
export const nonEmptyStringSchema = z
  .string()
  .min(1, 'This field is required')
  .trim();

/**
 * Date string validation (ISO 8601)
 */
export const dateStringSchema = z.string().datetime('Invalid date format');

/**
 * Optional date string
 */
export const optionalDateStringSchema = dateStringSchema.optional();

// ============================================================================
// USER SCHEMAS
// ============================================================================

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  phone: optionalPhoneSchema,
});

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * User update schema (all fields optional except userId)
 */
export const userUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional(),
  phone: optionalPhoneSchema.optional(),
  email: emailSchema.optional(),
});

// ============================================================================
// CUSTOMER SCHEMAS
// ============================================================================

/**
 * Customer creation schema
 */
export const customerCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  street: z
    .string()
    .min(3, 'Street must be at least 3 characters')
    .max(200, 'Street must be less than 200 characters')
    .trim(),
  zipCode: z
    .string()
    .min(3, 'Zip code must be at least 3 characters')
    .max(10, 'Zip code must be less than 10 characters')
    .trim(),
  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters')
    .trim(),
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal('')),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

/**
 * Customer update schema (all fields optional)
 */
export const customerUpdateSchema = customerCreateSchema.partial();

/**
 * Email opt-in schema
 */
export const emailOptInSchema = z.object({
  customerId: uuidSchema,
  email: emailSchema,
});

/**
 * Email opt-in confirmation schema
 */
export const emailOptInConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// ============================================================================
// HEATER SCHEMAS
// ============================================================================

/**
 * Heater creation schema
 */
export const heaterCreateSchema = z.object({
  customerId: uuidSchema,
  model: z
    .string()
    .min(2, 'Model must be at least 2 characters')
    .max(100, 'Model must be less than 100 characters')
    .trim(),
  serialNumber: z
    .string()
    .max(100, 'Serial number must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  installationDate: optionalDateStringSchema.or(z.literal('')),
  maintenanceInterval: z
    .number()
    .int('Maintenance interval must be a whole number')
    .positive('Maintenance interval must be positive')
    .refine(
      (val) => [1, 3, 6, 12, 24].includes(val),
      'Maintenance interval must be 1, 3, 6, 12, or 24 months'
    ),
  lastMaintenance: optionalDateStringSchema.or(z.literal('')),
  requiredParts: z
    .string()
    .max(500, 'Required parts must be less than 500 characters')
    .optional()
    .or(z.literal('')),
});

/**
 * Heater update schema (all fields optional except customerId validation)
 */
export const heaterUpdateSchema = z.object({
  model: z
    .string()
    .min(2, 'Model must be at least 2 characters')
    .max(100, 'Model must be less than 100 characters')
    .trim()
    .optional(),
  serialNumber: z
    .string()
    .max(100, 'Serial number must be less than 100 characters')
    .trim()
    .optional(),
  installationDate: optionalDateStringSchema,
  maintenanceInterval: z
    .number()
    .int('Maintenance interval must be a whole number')
    .positive('Maintenance interval must be positive')
    .refine(
      (val) => [1, 3, 6, 12, 24].includes(val),
      'Maintenance interval must be 1, 3, 6, 12, or 24 months'
    )
    .optional(),
  lastMaintenance: optionalDateStringSchema,
  requiredParts: z
    .string()
    .max(500, 'Required parts must be less than 500 characters')
    .optional(),
});

// ============================================================================
// MAINTENANCE SCHEMAS
// ============================================================================

/**
 * Maintenance creation schema
 */
export const maintenanceCreateSchema = z.object({
  heaterId: uuidSchema,
  date: dateStringSchema.optional(), // defaults to now if not provided
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  photos: z.array(z.string().url('Invalid photo URL')).max(10, 'Maximum 10 photos allowed').optional(),
});

/**
 * Maintenance update schema
 */
export const maintenanceUpdateSchema = z.object({
  date: dateStringSchema.optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional(),
  photos: z.array(z.string().url('Invalid photo URL')).max(10, 'Maximum 10 photos allowed').optional(),
});

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * ID parameter schema
 */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Search query schema
 */
export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long').trim(),
});

/**
 * Date range filter schema
 */
export const dateRangeSchema = z.object({
  startDate: dateStringSchema.optional(),
  endDate: dateStringSchema.optional(),
});

// ============================================================================
// FILE UPLOAD SCHEMAS
// ============================================================================

/**
 * File upload schema - validates file metadata
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255, 'Filename too long'),
  contentType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|webp)$/, 'Only JPEG, PNG, and WebP images are allowed'),
  size: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024, 'File size must be less than 5MB'), // 5MB max
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate and parse request body with Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated and parsed data
 * @throws ZodError if validation fails
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safe validation that returns success/error object
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Object with success flag and data or errors
 */
export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}
