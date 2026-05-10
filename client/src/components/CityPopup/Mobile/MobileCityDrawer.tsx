import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { IconPlus, IconX } from '@tabler/icons-react';

import useWeatherDataForCity from '@/api/dates/useWeatherDataForCity';
import useSunshineDataForCity from '@/api/dates/useSunshineDataForCity';
import useWeeklyWeatherForCity from '@/api/dates/useWeeklyWeatherForCity';
import CityNameRow from '@/components/CityPopup/Ribbon/CityNameRow';
import TodayReadout from '@/components/CityPopup/Ribbon/TodayReadout';
import DataChartTabs from '@/components/CityPopup/DataChartTabs';
import MobileTabBar from '@/components/CityPopup/Mobile/MobileTabBar';
import MobileDetailsList from '@/components/CityPopup/Mobile/MobileDetailsList';
import MobileCompareSheet from '@/components/CityPopup/Mobile/MobileCompareSheet';
import { useRibbonStats } from '@/components/CityPopup/hooks/useRibbonStats';
import { useAppStore } from '@/stores/useAppStore';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import { getSunshinePercent } from '@/utils/dataFormatting/getSunshinePercent';
import { hasSunshineData } from '@/utils/dataFormatting/hasSunshineData';
import { normalizeRainyDays } from '@/utils/dataFormatting/normalizeRainyDays';
import { normalizeWeekPrecip } from '@/utils/dataFormatting/normalizeWeekPrecip';
import { dateToWeekOfYear } from '@/utils/dateFormatting/dateToWeekOfYear';
import { extractMonthDay } from '@/utils/dateFormatting/extractMonthDay';
import { extractMonthFromDate } from '@/utils/dateFormatting/extractMonthFromDate';
import { isWeatherData } from '@/utils/typeGuards';
import {
  dataTypeToMobileTab,
  isChartTab,
  mobileTabToDataType,
} from '@/components/CityPopup/Mobile/mobileDrawerHelpers';
import { DataType } from '@/types/mapTypes';
import { MobileTab } from '@/types/mobileTabType';
import {
  CITY1_PRIMARY_COLOR,
  MONTH_MIDPOINT_DAY,
  STATE_ABBREVIATION_MAX_LENGTH,
  CITY2_PRIMARY_COLOR,
  MOBILE_DRAWER_HEIGHT_CAP_PX,
  MOBILE_DRAWER_HEIGHT_VH,
  MOBILE_DRAWER_HEADER_PX,
  MOBILE_DRAWER_CHART_MIN_PX,
  MOBILE_DRAWER_BOTTOM_PAD_PX,
  MOBILE_DRAWER_DRAG_HANDLE_W_PX,
  MOBILE_DRAWER_DRAG_HANDLE_H_PX,
  MOBILE_DRAWER_RADIUS_PX,
  MOBILE_DRAWER_DISMISS_DRAG_FRACTION,
  MOBILE_DRAWER_DISMISS_VELOCITY_PX_PER_S,
  MOBILE_DRAWER_DISMISS_VELOCITY_MIN_DT_MS,
  MOBILE_DRAWER_DISMISS_ANIM_MS,
  MS_PER_SECOND,
} from '@/const';
import { appColors } from '@/theme';

import type { CityPopupProps } from '@/types/mapTypes';
import type { SearchCitiesResult } from '@/types/userLocationType';
import type { TodayValuesByTab } from '@/types/cityPopupTypes';

const MobileCityDrawer = ({
  city,
  onClose,
  selectedMonth,
  selectedDate,
  dataType,
}: CityPopupProps) => {
  const { colorScheme } = useMantineColorScheme();
  const setIsCityDrawerOpen = useAppStore((s) => s.setIsCityDrawerOpen);

  const [comparisonCity, setComparisonCity] =
    useState<SearchCitiesResult | null>(null);
  const [tab, setTab] = useState<MobileTab>(dataTypeToMobileTab(dataType));
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [
    compareSheetOpened,
    { open: openCompareSheet, close: closeCompareSheet },
  ] = useDisclosure(false);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{ y: number; t: number } | null>(null);
  const lastPointerRef = useRef<{ y: number; t: number } | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsCityDrawerOpen(true);
    return () => {
      setIsCityDrawerOpen(false);
      if (dismissTimerRef.current !== null)
        clearTimeout(dismissTimerRef.current);
    };
  }, [setIsCityDrawerOpen]);

  useEffect(() => {
    setTab(dataTypeToMobileTab(dataType));
  }, [dataType]);

  const cityAsWeather = city && isWeatherData(city) ? city : null;
  const cityAsSunshine = city && !isWeatherData(city) ? city : null;

  const monthToUse =
    selectedMonth ??
    extractMonthFromDate(cityAsWeather?.date) ??
    new Date().getMonth() + 1;

  const dateToUse = useMemo(() => {
    if (selectedDate) return selectedDate;
    if (cityAsWeather?.date) return cityAsWeather.date;
    return `${monthToUse.toString().padStart(2, '0')}-${MONTH_MIDPOINT_DAY.toString().padStart(2, '0')}`;
  }, [selectedDate, cityAsWeather, monthToUse]);

  const shouldFetchWeather = !!city;

  const { weatherData } = useWeatherDataForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    selectedDate: dateToUse,
    skipFetch: !shouldFetchWeather,
  });

  const shouldFetchSunshine = !cityAsSunshine;

  const { sunshineData, sunshineLoading, sunshineError } =
    useSunshineDataForCity({
      cityName: city?.city ?? null,
      lat: city?.lat ?? null,
      long: city?.long ?? null,
      skipFetch: !shouldFetchSunshine,
    });

  const {
    weeklyWeatherData,
    loading: weeklyWeatherLoading,
    error: weeklyWeatherError,
  } = useWeeklyWeatherForCity({
    cityName: city?.city ?? null,
    lat: city?.lat ?? null,
    long: city?.long ?? null,
    skipFetch: !city,
  });

  const monthDayOnly = useMemo(() => extractMonthDay(dateToUse), [dateToUse]);

  const { weatherData: comparisonWeatherData } = useWeatherDataForCity({
    cityName: comparisonCity?.name ?? null,
    lat: comparisonCity?.lat ?? null,
    long: comparisonCity?.long ?? null,
    selectedDate: monthDayOnly,
    skipFetch: !comparisonCity,
  });

  const { weeklyWeatherData: comparisonWeeklyWeatherData } =
    useWeeklyWeatherForCity({
      cityName: comparisonCity?.name ?? null,
      lat: comparisonCity?.lat ?? null,
      long: comparisonCity?.long ?? null,
      skipFetch: !comparisonCity,
    });

  const { sunshineData: comparisonSunshineData } = useSunshineDataForCity({
    cityName: comparisonCity?.name ?? null,
    lat: comparisonCity?.lat ?? null,
    long: comparisonCity?.long ?? null,
    skipFetch: !comparisonCity,
  });

  const displayWeatherData = weatherData ?? cityAsWeather;
  const displaySunshineData = cityAsSunshine ?? sunshineData;

  const primaryHasSunshine = hasSunshineData(displaySunshineData);
  const comparisonHasSunshine = hasSunshineData(comparisonSunshineData);

  const sunshineTabAvailable =
    sunshineLoading || primaryHasSunshine || comparisonHasSunshine;

  const availableTabs = useMemo<ReadonlyArray<MobileTab>>(
    () =>
      sunshineTabAvailable
        ? [
            MobileTab.Temperature,
            MobileTab.Sunshine,
            MobileTab.Precip,
            MobileTab.Details,
          ]
        : [MobileTab.Temperature, MobileTab.Precip, MobileTab.Details],
    [sunshineTabAvailable]
  );

  const visibleTab = availableTabs.includes(tab)
    ? tab
    : (availableTabs[0] ?? MobileTab.Temperature);

  const stats = useRibbonStats({
    basePopulation: city?.population ?? null,
    comparisonPopulation: comparisonCity?.population ?? null,
    baseLat: city?.lat ?? null,
    baseLong: city?.long ?? null,
    comparisonLat: comparisonCity?.lat ?? null,
    comparisonLong: comparisonCity?.long ?? null,
    displayWeatherData,
    comparisonWeatherData,
    displaySunshineData,
    comparisonSunshineData,
    weeklyWeatherData,
    comparisonWeeklyWeatherData,
  });

  const todayValuesByTab = useMemo<TodayValuesByTab>(() => {
    const selectedWeek = dateToWeekOfYear(dateToUse);
    const findWeek = (data: typeof weeklyWeatherData) =>
      selectedWeek === null
        ? null
        : (data?.weeklyData.find((w) => w.week === selectedWeek) ?? null);

    const w1 = findWeek(weeklyWeatherData);
    const w2 = findWeek(comparisonWeeklyWeatherData);

    return {
      [DataType.Temperature]: {
        c1: displayWeatherData?.avgTemperature ?? null,
        c2: comparisonWeatherData?.avgTemperature ?? null,
      },
      [DataType.Sunshine]: {
        c1: getSunshinePercent(displaySunshineData, monthToUse, city?.lat),
        c2: getSunshinePercent(
          comparisonSunshineData,
          monthToUse,
          comparisonCity?.lat
        ),
      },
      [DataType.Precip]: {
        c1: normalizeWeekPrecip(w1),
        c2: normalizeWeekPrecip(w2),
        subC1: normalizeRainyDays(w1),
        subC2: normalizeRainyDays(w2),
      },
    };
  }, [
    dateToUse,
    monthToUse,
    city?.lat,
    comparisonCity?.lat,
    displayWeatherData,
    comparisonWeatherData,
    displaySunshineData,
    comparisonSunshineData,
    weeklyWeatherData,
    comparisonWeeklyWeatherData,
  ]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const now = performance.now();
    dragStartRef.current = { y: e.clientY, t: now };
    lastPointerRef.current = { y: e.clientY, t: now };
    setDragOffset(0);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dy = Math.max(0, e.clientY - dragStartRef.current.y);
    lastPointerRef.current = { y: e.clientY, t: performance.now() };
    setDragOffset(dy);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);

    const finalDy = Math.max(0, e.clientY - dragStartRef.current.y);
    const drawerHeight = drawerRef.current?.getBoundingClientRect().height ?? 0;
    const distanceThreshold =
      drawerHeight * MOBILE_DRAWER_DISMISS_DRAG_FRACTION;

    const last = lastPointerRef.current;
    const dt = last ? last.t - dragStartRef.current.t : 0;
    const velocityPxPerS =
      dt >= MOBILE_DRAWER_DISMISS_VELOCITY_MIN_DT_MS
        ? (finalDy / dt) * MS_PER_SECOND
        : 0;

    dragStartRef.current = null;
    lastPointerRef.current = null;

    const shouldDismiss =
      finalDy > distanceThreshold ||
      velocityPxPerS > MOBILE_DRAWER_DISMISS_VELOCITY_PX_PER_S;

    if (shouldDismiss) {
      setIsDismissing(true);
      dismissTimerRef.current = setTimeout(() => {
        onClose();
      }, MOBILE_DRAWER_DISMISS_ANIM_MS);
    } else {
      setDragOffset(null);
    }
  };

  if (!city) return null;

  let cityAndCountry = city.city ? toTitleCase(city.city) : 'Unknown City';
  if (city.state) {
    const state =
      city.state.length > STATE_ABBREVIATION_MAX_LENGTH
        ? city.state.substring(0, STATE_ABBREVIATION_MAX_LENGTH) + '.'
        : city.state;
    cityAndCountry += `, ${toTitleCase(state)}`;
  }
  if (city.country) {
    cityAndCountry += `, ${city.country}`;
  }

  const comparisonName = comparisonCity
    ? [comparisonCity.name, comparisonCity.state, comparisonCity.country]
        .filter(Boolean)
        .join(', ')
    : null;

  const transformValue = isDismissing
    ? 'translateY(100%)'
    : dragOffset !== null
      ? `translateY(${dragOffset}px)`
      : 'translateY(0)';

  const transitionValue =
    dragOffset !== null && !isDismissing
      ? 'none'
      : `transform ${MOBILE_DRAWER_DISMISS_ANIM_MS}ms ease`;

  const chartTabForDataChartTabs = isChartTab(visibleTab)
    ? mobileTabToDataType(visibleTab)
    : DataType.Temperature;

  const todayPair = todayValuesByTab[chartTabForDataChartTabs];

  return (
    <div
      ref={drawerRef}
      data-testid="mobile-city-drawer"
      className="fixed left-0 right-0 bottom-0 flex flex-col shadow-lg"
      style={{
        height: `min(${MOBILE_DRAWER_HEIGHT_VH}vh, ${MOBILE_DRAWER_HEIGHT_CAP_PX}px)`,
        borderTopLeftRadius: MOBILE_DRAWER_RADIUS_PX,
        borderTopRightRadius: MOBILE_DRAWER_RADIUS_PX,
        backgroundColor:
          colorScheme === 'dark'
            ? appColors.dark.surface
            : appColors.light.surface,
        borderTop: '1px solid var(--mantine-color-default-border)',
        pointerEvents: 'auto',
        transform: transformValue,
        transition: transitionValue,
        zIndex: 50,
      }}
    >
      <div
        data-testid="mobile-drawer-drag-region"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="shrink-0 cursor-grab touch-none"
        style={{
          paddingTop: 8,
          paddingBottom: 6,
          minHeight: MOBILE_DRAWER_HEADER_PX,
        }}
      >
        <div
          aria-hidden="true"
          className="mx-auto rounded-full bg-[var(--mantine-color-default-border)]"
          style={{
            width: MOBILE_DRAWER_DRAG_HANDLE_W_PX,
            height: MOBILE_DRAWER_DRAG_HANDLE_H_PX,
          }}
        />
        <header className="flex items-start justify-between gap-2 px-4 mt-1">
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <CityNameRow
              color={CITY1_PRIMARY_COLOR}
              name={cityAndCountry}
              lat={city.lat ?? null}
            />
            {comparisonName ? (
              <CityNameRow
                color={CITY2_PRIMARY_COLOR}
                name={comparisonName}
                lat={comparisonCity?.lat ?? null}
                onClick={openCompareSheet}
                actions={
                  <button
                    type="button"
                    onClick={() => setComparisonCity(null)}
                    aria-label="Remove comparison city"
                    className="ml-0.5 text-[var(--mantine-color-dimmed)] hover:text-[var(--mantine-color-text)] cursor-pointer shrink-0"
                  >
                    <IconX size={14} />
                  </button>
                }
              />
            ) : (
              <button
                type="button"
                onClick={openCompareSheet}
                aria-label="Add comparison city"
                className="flex items-center gap-2 cursor-pointer text-[var(--mantine-color-dimmed)] hover:text-[var(--mantine-color-text)] transition-colors self-start"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full opacity-60"
                  style={{ background: CITY2_PRIMARY_COLOR }}
                />
                <span className="text-[15px] font-bold font-[Outfit_Variable]">
                  Compare
                </span>
                <IconPlus size={14} className="opacity-70" />
              </button>
            )}
          </div>
          <ActionIcon
            onClick={onClose}
            aria-label="Close"
            variant="subtle"
            size="md"
          >
            <IconX size={20} />
          </ActionIcon>
        </header>
      </div>

      <main
        className="flex-1 min-h-0 flex flex-col px-4"
        style={{ paddingBottom: MOBILE_DRAWER_BOTTOM_PAD_PX }}
      >
        {visibleTab === MobileTab.Details ? (
          <MobileDetailsList stats={stats} hasComparison={!!comparisonCity} />
        ) : (
          <>
            <div
              className="flex-1 min-h-0"
              style={{ minHeight: MOBILE_DRAWER_CHART_MIN_PX }}
            >
              <DataChartTabs
                tab={chartTabForDataChartTabs}
                displaySunshineData={displaySunshineData}
                sunshineLoading={sunshineLoading}
                sunshineError={!!sunshineError}
                selectedMonth={monthToUse}
                selectedDate={dateToUse}
                weeklyWeatherData={weeklyWeatherData}
                weeklyWeatherLoading={weeklyWeatherLoading}
                weeklyWeatherError={!!weeklyWeatherError}
                comparisonSunshineData={comparisonSunshineData}
                comparisonWeeklyWeatherData={comparisonWeeklyWeatherData}
              />
            </div>
            <div data-testid="mobile-drawer-today-readout" className="shrink-0">
              <TodayReadout
                tab={chartTabForDataChartTabs}
                c1Value={todayPair.c1}
                c2Value={todayPair.c2}
                subC1Value={todayPair.subC1 ?? null}
                subC2Value={todayPair.subC2 ?? null}
                hasComparison={!!comparisonCity}
                selectedDate={dateToUse}
                hover={null}
              />
            </div>
          </>
        )}
      </main>

      <MobileTabBar
        tab={visibleTab}
        onTab={setTab}
        availableTabs={availableTabs}
      />

      <MobileCompareSheet
        opened={compareSheetOpened}
        onClose={closeCompareSheet}
        onCitySelect={setComparisonCity}
        excludeCity={{
          name: city.city ?? '',
          state: city.state ?? null,
          country: city.country ?? null,
        }}
      />
    </div>
  );
};

export default MobileCityDrawer;
