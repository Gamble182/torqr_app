import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import { addCategorySchema, addManufacturerSchema, addModelSchema } from '@/lib/validations';

const CONFIG_PATH = path.join(process.cwd(), 'src/config/heating-systems.json');

interface Model {
  manufacturer: string;
  models: string[];
}

interface Category {
  category: string;
  manufacturers: Model[];
}

interface HeatingSystemsConfig {
  heating_categories: Category[];
}

/**
 * GET /api/heating-systems
 * Get the heating systems configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Read the config file
    const fileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config: HeatingSystemsConfig = JSON.parse(fileContent);

    return NextResponse.json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error('Error reading heating systems config:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Laden der Heizungssysteme',
    }, { status: 500 });
  }
}

/**
 * POST /api/heating-systems
 * Add a new category, manufacturer, or model to the configuration
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (only authenticated users can add entries)
    await requireAuth();

    // 2. Parse request body
    const body = await request.json();
    const { type } = body;

    // 3. Read current config
    const fileContent = await fs.readFile(CONFIG_PATH, 'utf-8');
    const config: HeatingSystemsConfig = JSON.parse(fileContent);

    // 4. Handle different types of additions
    if (type === 'category') {
      // Add new category
      const validatedData = addCategorySchema.parse(body);

      // Check if category already exists
      const exists = config.heating_categories.some(
        cat => cat.category.toLowerCase() === validatedData.category.toLowerCase()
      );

      if (exists) {
        return NextResponse.json({
          success: false,
          error: 'Diese Kategorie existiert bereits',
        }, { status: 400 });
      }

      // Add new category
      config.heating_categories.push({
        category: validatedData.category,
        manufacturers: [],
      });

      // Sort categories alphabetically
      config.heating_categories.sort((a, b) => a.category.localeCompare(b.category));

    } else if (type === 'manufacturer') {
      // Add new manufacturer to a category
      const validatedData = addManufacturerSchema.parse(body);

      // Find the category
      const category = config.heating_categories.find(
        cat => cat.category === validatedData.category
      );

      if (!category) {
        return NextResponse.json({
          success: false,
          error: 'Kategorie nicht gefunden',
        }, { status: 404 });
      }

      // Check if manufacturer already exists in this category
      const exists = category.manufacturers.some(
        mfr => mfr.manufacturer.toLowerCase() === validatedData.manufacturer.toLowerCase()
      );

      if (exists) {
        return NextResponse.json({
          success: false,
          error: 'Dieser Hersteller existiert bereits in dieser Kategorie',
        }, { status: 400 });
      }

      // Add new manufacturer
      category.manufacturers.push({
        manufacturer: validatedData.manufacturer,
        models: [],
      });

      // Sort manufacturers alphabetically
      category.manufacturers.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer));

    } else if (type === 'model') {
      // Add new model to a manufacturer
      const validatedData = addModelSchema.parse(body);

      // Find the category
      const category = config.heating_categories.find(
        cat => cat.category === validatedData.category
      );

      if (!category) {
        return NextResponse.json({
          success: false,
          error: 'Kategorie nicht gefunden',
        }, { status: 404 });
      }

      // Find the manufacturer
      const manufacturer = category.manufacturers.find(
        mfr => mfr.manufacturer === validatedData.manufacturer
      );

      if (!manufacturer) {
        return NextResponse.json({
          success: false,
          error: 'Hersteller nicht gefunden',
        }, { status: 404 });
      }

      // Check if model already exists for this manufacturer
      const exists = manufacturer.models.some(
        model => model.toLowerCase() === validatedData.model.toLowerCase()
      );

      if (exists) {
        return NextResponse.json({
          success: false,
          error: 'Dieses Modell existiert bereits für diesen Hersteller',
        }, { status: 400 });
      }

      // Add new model
      manufacturer.models.push(validatedData.model);

      // Sort models alphabetically
      manufacturer.models.sort((a, b) => a.localeCompare(b));

    } else {
      return NextResponse.json({
        success: false,
        error: 'Ungültiger Typ. Muss "category", "manufacturer" oder "model" sein.',
      }, { status: 400 });
    }

    // 5. Write updated config back to file
    await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');

    // 6. Return success
    return NextResponse.json({
      success: true,
      data: config,
      message: 'Erfolgreich hinzugefügt',
    }, { status: 201 });

  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validierungsfehler',
        details: error.issues,
      }, { status: 400 });
    }

    // Handle authentication errors
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({
        success: false,
        error: 'Nicht autorisiert',
      }, { status: 401 });
    }

    // Handle other errors
    console.error('Error updating heating systems config:', error);
    return NextResponse.json({
      success: false,
      error: 'Fehler beim Aktualisieren der Heizungssysteme',
    }, { status: 500 });
  }
}
