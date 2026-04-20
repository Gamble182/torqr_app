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

/**
 * User profile update schema (account page — profile card)
 */
export const userProfileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name muss mindestens 2 Zeichen haben')
    .max(100, 'Name zu lang')
    .trim()
    .optional(),
  email: emailSchema.optional(),
  phone: optionalPhoneSchema.optional(),
  companyName: z
    .string()
    .max(100, 'Firmenname zu lang')
    .trim()
    .optional()
    .or(z.literal('')),
});

/**
 * Password change schema (account page — password card)
 */
export const userPasswordUpdateSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: passwordSchema,
});

/**
 * User preferences update schema (account page — notifications card)
 */
export const userPreferencesUpdateSchema = z.object({
  emailWeeklySummary: z.boolean(),
});

// ============================================================================
// CUSTOMER SCHEMAS
// ============================================================================

/**
 * Customer creation schema
 */
export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Name zu lang'),
  street: z.string().min(1, 'Straße ist erforderlich').max(100, 'Straße zu lang'),
  zipCode: z.string().min(4, 'PLZ muss mindestens 4 Zeichen haben').max(10, 'PLZ zu lang'),
  city: z.string().min(1, 'Stadt ist erforderlich').max(100, 'Stadt zu lang'),
  phone: z.string().min(1, 'Telefon ist erforderlich').max(20, 'Telefon zu lang'),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  suppressEmail: z.boolean().optional().default(false),
  notes: z.string().max(1000, 'Notizen zu lang').optional(),
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
// SYSTEM CATALOG SCHEMAS
// ============================================================================

const SystemTypeEnum = z.enum(['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE']);
const AcSubtypeEnum = z.enum(['SINGLE_SPLIT', 'MULTI_SPLIT_2', 'MULTI_SPLIT_3', 'MULTI_SPLIT_4', 'MULTI_SPLIT_5']);
const StorageSubtypeEnum = z.enum(['BOILER', 'BUFFER_TANK']);

export const catalogCreateSchema = z
  .object({
    systemType: SystemTypeEnum,
    manufacturer: z.string().min(1, 'Hersteller ist erforderlich').max(100),
    name: z.string().min(1, 'Name ist erforderlich').max(100),
    acSubtype: AcSubtypeEnum.optional(),
    storageSubtype: StorageSubtypeEnum.optional(),
  })
  .refine(
    (data) => data.systemType !== 'AC' || data.acSubtype !== undefined,
    { message: 'AC-Subtyp ist für Klimaanlagen erforderlich', path: ['acSubtype'] }
  );

// ============================================================================
// CUSTOMER SYSTEM SCHEMAS
// ============================================================================

export const customerSystemCreateSchema = z.object({
  catalogId: uuidSchema,
  customerId: uuidSchema,
  serialNumber: z.string().max(100).optional().nullable(),
  installationDate: z.string().datetime().optional().nullable(),
  maintenanceInterval: z.number().int().positive({
    message: 'Wartungsintervall muss eine positive Zahl sein',
  }),
  lastMaintenance: z.string().datetime().optional().nullable(),
  storageCapacityLiters: z.number().int().positive().optional().nullable(),
  requiredParts: z.string().optional().nullable(),
});

export const customerSystemUpdateSchema = z.object({
  catalogId: uuidSchema.optional(),
  customerId: uuidSchema.optional(),
  serialNumber: z.string().max(100).optional().nullable(),
  installationDate: z.string().datetime().optional().nullable(),
  maintenanceInterval: z.number().int().positive({
    message: 'Wartungsintervall muss eine positive Zahl sein',
  }).optional(),
  lastMaintenance: z.string().datetime().optional().nullable(),
  storageCapacityLiters: z.number().int().positive().optional().nullable(),
  requiredParts: z.string().optional().nullable(),
});

// ============================================================================
// MAINTENANCE SCHEMAS
// ============================================================================

export const maintenanceCreateSchema = z.object({
  systemId: uuidSchema,
  date: dateStringSchema.optional(),
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
