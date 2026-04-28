import { z } from 'zod';

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
  phone: optionalPhoneSchema,
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
  phone: optionalPhoneSchema,
  companyName: z
    .string()
    .max(100, 'Firmenname zu lang')
    .trim()
    .optional()
    .or(z.literal('')),
  reminderGreeting: z
    .string()
    .max(200, 'Begrüßung zu lang (max. 200 Zeichen)')
    .trim()
    .optional()
    .nullable(),
  reminderBody: z
    .string()
    .max(1000, 'Nachrichtentext zu lang (max. 1000 Zeichen)')
    .trim()
    .optional()
    .nullable(),
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
    acSubtype: AcSubtypeEnum.nullish(),
    storageSubtype: StorageSubtypeEnum.nullish(),
  })
  .refine(
    (data) => data.systemType !== 'AC' || !!data.acSubtype,
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
  assignedToUserId: uuidSchema.optional().nullable(),
});

// ============================================================================
// BOOKING SCHEMAS
// ============================================================================

export const manualBookingCreateSchema = z.object({
  systemId: uuidSchema,
  startTime: z.string().datetime('Ungültiges Datum'),
  endTime: z.string().datetime('Ungültiges Datum').optional(),
});

export const bookingRangeEnum = z.enum(['upcoming', 'week', 'month', 'past', 'all']);
export const bookingSourceEnum = z.enum(['cal', 'manual', 'all']);
export const bookingStatusEnum = z.enum(['CONFIRMED', 'CANCELLED', 'RESCHEDULED']);
export const bookingSystemTypeEnum = z.enum(['HEATING', 'AC', 'WATER_TREATMENT', 'ENERGY_STORAGE', 'all']);

export const bookingListQuerySchema = z.object({
  range: bookingRangeEnum.optional().default('upcoming'),
  status: z.union([bookingStatusEnum, z.array(bookingStatusEnum)]).optional(),
  assignee: z.string().uuid().or(z.literal('unassigned')).optional(),
  customerId: uuidSchema.optional(),
  systemType: bookingSystemTypeEnum.optional(),
  source: bookingSourceEnum.optional().default('all'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
});

/**
 * Body schema for PATCH /api/bookings/[id] — manual reschedule.
 * endTime is optional; if omitted the existing duration is preserved.
 */
export const bookingRescheduleSchema = z.object({
  startTime: z.string().datetime('Ungültiges Datum'),
  endTime: z.string().datetime('Ungültiges Datum').optional(),
  notifyCustomer: z.boolean().optional().default(true),
  reason: z.string().max(500, 'Grund zu lang').optional().nullable(),
});

/**
 * Body schema for DELETE /api/bookings/[id] — cancellation.
 * Body is optional (endpoint accepts empty JSON or no body).
 */
export const bookingCancelSchema = z.object({
  notifyCustomer: z.boolean().optional().default(true),
  reason: z.string().max(500, 'Grund zu lang').optional().nullable(),
});

// ============================================================================
// CHECKLIST SCHEMAS
// ============================================================================

export const checklistItemSnapshotSchema = z.object({
  label: z.string().min(1).max(200),
  checked: z.boolean(),
  isCustom: z.boolean(),
});

export const checklistSnapshotSchema = z.object({
  items: z.array(checklistItemSnapshotSchema),
  confirmedAt: z.string().datetime(),
});

export const checklistItemCreateSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'Bezeichnung ist erforderlich')
    .max(200, 'Bezeichnung zu lang'),
});

// ============================================================================
// SYSTEM PHOTO SCHEMAS
// ============================================================================

export const systemPhotoDeleteSchema = z.object({
  url: z.string().url('Ungültige URL'),
});

// ============================================================================
// FOLLOW-UP JOB SCHEMAS
// ============================================================================

export const followUpJobCreateSchema = z.object({
  label: z
    .string()
    .min(1, 'Bezeichnung erforderlich')
    .max(200, 'Bezeichnung zu lang (max. 200 Zeichen)')
    .trim(),
  description: z
    .string()
    .max(1000, 'Beschreibung zu lang (max. 1000 Zeichen)')
    .trim()
    .optional()
    .nullable(),
  photos: z
    .array(z.string().url())
    .max(10, 'Maximal 10 Fotos')
    .optional()
    .default([]),
  maintenanceId: z.string().optional().nullable(),
});

export const followUpJobUpdateSchema = z.object({
  label: z
    .string()
    .min(1, 'Bezeichnung erforderlich')
    .max(200, 'Bezeichnung zu lang (max. 200 Zeichen)')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Beschreibung zu lang (max. 1000 Zeichen)')
    .trim()
    .optional()
    .nullable(),
  photos: z
    .array(z.string().url())
    .max(10, 'Maximal 10 Fotos')
    .optional(),
  completed: z.boolean().optional(),
});

// ============================================================================
// MAINTENANCE SCHEMAS
// ============================================================================

// partsUsedEntrySchema is declared here (before maintenanceCreateSchema) so it
// can be referenced by the maintenanceCreateSchema.partsUsed field below. The
// rest of the Phase A (Wartungsteile) schemas live in a single block at the
// end of this file.
export const partsUsedEntrySchema = z
  .object({
    sourceType: z.enum(['DEFAULT', 'OVERRIDE_ADD', 'AD_HOC']),
    setItemId: z.string().uuid().optional(),
    overrideId: z.string().uuid().optional(),
    inventoryItemId: z.string().uuid().optional(),
    description: z.string().min(1),
    articleNumber: z.string().optional(),
    quantity: z.coerce.number().min(0),
    unit: z.string().min(1),
  })
  .refine((d) => d.sourceType !== 'DEFAULT' || !!d.setItemId, {
    message: 'setItemId ist bei sourceType=DEFAULT erforderlich',
    path: ['setItemId'],
  })
  .refine((d) => d.sourceType !== 'OVERRIDE_ADD' || !!d.overrideId, {
    message: 'overrideId ist bei sourceType=OVERRIDE_ADD erforderlich',
    path: ['overrideId'],
  });

export const maintenanceCreateSchema = z.object({
  systemId: uuidSchema,
  date: dateStringSchema.optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable(),
  photos: z.array(z.string().url('Invalid photo URL')).max(10, 'Maximum 10 photos allowed').optional(),
  checklistData: checklistSnapshotSchema.optional().nullable(),
  partsUsed: z.array(partsUsedEntrySchema).optional().default([]),
});

/**
 * Maintenance update schema
 */
export const maintenanceUpdateSchema = z.object({
  date: dateStringSchema.optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable(),
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
// EMPLOYEE MANAGEMENT SCHEMAS
// ============================================================================

/**
 * Create a new technician account (OWNER only)
 */
export const employeeCreateSchema = z.object({
  name: nonEmptyStringSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
});

// ============================================================================
// ASSIGNMENT / WORKLOAD SCHEMAS
// ============================================================================

/**
 * Query-param filter for /api/customer-systems?assignee=...
 * - 'all' or missing: no filter
 * - 'unassigned': assignedToUserId is null
 * - <uuid>: assignedToUserId equals that user id
 */
export const assigneeFilterSchema = z.union([
  z.literal('all'),
  z.literal('unassigned'),
  z.string().uuid(),
]);

export type AssigneeFilter = z.infer<typeof assigneeFilterSchema>;

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

// ============================================================================
// MAINTENANCE SETS + INVENTORY (Phase A)
// ============================================================================
// Note: `partsUsedEntrySchema` is declared higher in this file (before
// `maintenanceCreateSchema`) because the maintenance create schema references
// it. All other Phase A (Wartungsteile & Materialmanagement) schemas live in
// this single block.

export const partCategoryEnum = z.enum(['SPARE_PART', 'CONSUMABLE', 'TOOL']);
export const overrideActionEnum = z.enum(['ADD', 'EXCLUDE']);
export const movementReasonEnum = z.enum([
  'MAINTENANCE_USE',
  'MANUAL_ADJUSTMENT',
  'RESTOCK',
  'CORRECTION',
]);

const decimalPositive = z.coerce.number().positive();
const decimalNonZero = z.coerce.number().refine((v) => v !== 0, {
  message: 'Menge darf nicht 0 sein',
});

// --- Maintenance sets -------------------------------------------------------

export const maintenanceSetCreateSchema = z.object({
  catalogId: z.string().uuid(),
});

const maintenanceSetItemBase = z.object({
  category: partCategoryEnum,
  description: z.string().min(1),
  articleNumber: z.string().optional(),
  quantity: decimalPositive.default(1),
  unit: z.string().min(1).default('Stck'),
  required: z.boolean().optional().default(true),
  note: z.string().optional(),
  sortOrder: z.number().int().optional().default(0),
  inventoryItemId: z.string().uuid().optional(),
});

const toolRefineMessage: { message: string; path: PropertyKey[] } = {
  message: 'Werkzeug darf nicht an ein Lagerteil gebunden sein',
  path: ['inventoryItemId'],
};

export const maintenanceSetItemCreateSchema = maintenanceSetItemBase.refine(
  (d) => !(d.category === 'TOOL' && d.inventoryItemId),
  toolRefineMessage,
);

export const maintenanceSetItemUpdateSchema = maintenanceSetItemBase
  .partial()
  .refine((d) => !(d.category === 'TOOL' && d.inventoryItemId), toolRefineMessage);

export const maintenanceSetItemsReorderSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), sortOrder: z.number().int() })),
});

// --- Customer-system overrides (discriminated union) -----------------------

const overrideAddSchema = z
  .object({
    action: z.literal('ADD'),
    category: partCategoryEnum,
    description: z.string().min(1),
    articleNumber: z.string().optional(),
    quantity: decimalPositive,
    unit: z.string().min(1),
    required: z.boolean().optional().default(true),
    note: z.string().optional(),
    sortOrder: z.number().int().optional().default(0),
    inventoryItemId: z.string().uuid().optional(),
    excludedSetItemId: z.undefined(),
  })
  .refine((d) => !(d.category === 'TOOL' && d.inventoryItemId), {
    message: 'Werkzeug darf nicht an ein Lagerteil gebunden sein',
    path: ['inventoryItemId'],
  });

const overrideExcludeSchema = z.object({
  action: z.literal('EXCLUDE'),
  excludedSetItemId: z.string().uuid(),
  // All ADD-fields must be absent.
  category: z.undefined(),
  description: z.undefined(),
  articleNumber: z.undefined(),
  quantity: z.undefined(),
  unit: z.undefined(),
  required: z.undefined(),
  note: z.undefined(),
  sortOrder: z.undefined(),
  inventoryItemId: z.undefined(),
});

export const customerSystemOverrideSchema = z.discriminatedUnion('action', [
  overrideAddSchema,
  overrideExcludeSchema,
]);

// --- Inventory -------------------------------------------------------------

export const inventoryItemCreateSchema = z
  .object({
    description: z.string().min(1),
    articleNumber: z.string().optional(),
    unit: z.string().min(1).default('Stck'),
    minStock: z.coerce.number().min(0).default(0),
  })
  .strict();

// Note: `.partial()` on a strict object preserves strict mode in Zod 4.
// We append `.strict()` again defensively in case the Zod version behaves
// differently, ensuring unknown keys like `currentStock` stay rejected.
export const inventoryItemUpdateSchema = inventoryItemCreateSchema.partial().strict();

export const inventoryMovementCreateSchema = z
  .object({
    reason: z.enum(['RESTOCK', 'CORRECTION']),
    quantityChange: decimalNonZero,
    note: z.string().optional(),
  })
  .strict();
