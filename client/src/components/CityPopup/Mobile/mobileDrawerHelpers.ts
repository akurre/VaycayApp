import { DataType } from '@/types/mapTypes';
import { MobileTab } from '@/types/mobileTabType';

export const dataTypeToMobileTab = (d: DataType): MobileTab => {
  if (d === DataType.Sunshine) return MobileTab.Sunshine;
  if (d === DataType.Precip) return MobileTab.Precip;
  return MobileTab.Temperature;
};

export const isChartTab = (
  t: MobileTab
): t is Exclude<MobileTab, MobileTab.Details> => t !== MobileTab.Details;

export const mobileTabToDataType = (t: MobileTab): DataType => {
  if (t === MobileTab.Sunshine) return DataType.Sunshine;
  if (t === MobileTab.Precip) return DataType.Precip;
  return DataType.Temperature;
};
