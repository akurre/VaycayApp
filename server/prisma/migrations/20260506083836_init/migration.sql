-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT,
    "suburb" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "cityAscii" TEXT,
    "iso2" TEXT,
    "iso3" TEXT,
    "capital" TEXT,
    "worldcitiesId" DOUBLE PRECISION,
    "population" DOUBLE PRECISION,
    "dataSource" TEXT,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_stations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" INTEGER NOT NULL,

    CONSTRAINT "weather_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weather_records" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "stationId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "PRCP" DOUBLE PRECISION,
    "SNWD" DOUBLE PRECISION,
    "TAVG" DOUBLE PRECISION,
    "TMAX" DOUBLE PRECISION,
    "TMIN" DOUBLE PRECISION,
    "AWND" DOUBLE PRECISION,
    "DAPR" DOUBLE PRECISION,
    "DATN" DOUBLE PRECISION,
    "DATX" DOUBLE PRECISION,
    "DWPR" DOUBLE PRECISION,
    "MDPR" DOUBLE PRECISION,
    "MDTN" DOUBLE PRECISION,
    "MDTX" DOUBLE PRECISION,
    "WDF2" DOUBLE PRECISION,
    "WDF5" DOUBLE PRECISION,
    "WSF2" DOUBLE PRECISION,
    "WSF5" DOUBLE PRECISION,

    CONSTRAINT "weather_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_sunshine" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "jan" DOUBLE PRECISION,
    "feb" DOUBLE PRECISION,
    "mar" DOUBLE PRECISION,
    "apr" DOUBLE PRECISION,
    "may" DOUBLE PRECISION,
    "jun" DOUBLE PRECISION,
    "jul" DOUBLE PRECISION,
    "aug" DOUBLE PRECISION,
    "sep" DOUBLE PRECISION,
    "oct" DOUBLE PRECISION,
    "nov" DOUBLE PRECISION,
    "dec" DOUBLE PRECISION,
    "annual" DOUBLE PRECISION,

    CONSTRAINT "monthly_sunshine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_weather" (
    "id" SERIAL NOT NULL,
    "cityId" INTEGER NOT NULL,
    "weeklyData" JSONB NOT NULL,

    CONSTRAINT "weekly_weather_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cities_name_idx" ON "cities"("name");

-- CreateIndex
CREATE INDEX "cities_country_idx" ON "cities"("country");

-- CreateIndex
CREATE INDEX "cities_lat_long_idx" ON "cities"("lat", "long");

-- CreateIndex
CREATE INDEX "cities_country_lat_long_idx" ON "cities"("country", "lat", "long");

-- CreateIndex
CREATE INDEX "cities_country_population_idx" ON "cities"("country", "population");

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_country_lat_long_key" ON "cities"("name", "country", "lat", "long");

-- CreateIndex
CREATE INDEX "weather_stations_cityId_idx" ON "weather_stations"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "weather_stations_name_cityId_key" ON "weather_stations"("name", "cityId");

-- CreateIndex
CREATE INDEX "weather_records_date_idx" ON "weather_records"("date");

-- CreateIndex
CREATE INDEX "weather_records_cityId_date_idx" ON "weather_records"("cityId", "date");

-- CreateIndex
CREATE INDEX "weather_records_cityId_idx" ON "weather_records"("cityId");

-- CreateIndex
CREATE INDEX "weather_records_date_TAVG_idx" ON "weather_records"("date", "TAVG");

-- CreateIndex
CREATE UNIQUE INDEX "weather_records_cityId_stationId_date_key" ON "weather_records"("cityId", "stationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_sunshine_cityId_key" ON "monthly_sunshine"("cityId");

-- CreateIndex
CREATE INDEX "monthly_sunshine_cityId_idx" ON "monthly_sunshine"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_weather_cityId_key" ON "weekly_weather"("cityId");

-- CreateIndex
CREATE INDEX "weekly_weather_cityId_idx" ON "weekly_weather"("cityId");

-- AddForeignKey
ALTER TABLE "weather_stations" ADD CONSTRAINT "weather_stations_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weather_records" ADD CONSTRAINT "weather_records_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "weather_stations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_sunshine" ADD CONSTRAINT "monthly_sunshine_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_weather" ADD CONSTRAINT "weekly_weather_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
