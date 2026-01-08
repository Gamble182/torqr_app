-- CreateEnum
CREATE TYPE "HeatingType" AS ENUM ('GAS', 'OIL', 'DISTRICT_HEATING', 'HEAT_PUMP_AIR', 'HEAT_PUMP_GROUND', 'HEAT_PUMP_WATER', 'PELLET_BIOMASS', 'NIGHT_STORAGE', 'ELECTRIC_DIRECT', 'HYBRID', 'CHP');

-- CreateEnum
CREATE TYPE "AdditionalEnergy" AS ENUM ('PHOTOVOLTAIC', 'SOLAR_THERMAL', 'SMALL_WIND', 'BATTERY_STORAGE', 'HEAT_STORAGE');

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "additionalEnergy" "AdditionalEnergy",
ADD COLUMN     "heatingType" "HeatingType";
