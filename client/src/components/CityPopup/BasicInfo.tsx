import React from 'react';
import { WeatherDataUnion } from '@/types/mapTypes';
import { toTitleCase } from '@/utils/dataFormatting/toTitleCase';
import Field from './Field';

interface BasicInfoProps {
  city: WeatherDataUnion;
}

const BasicInfo = ({ city }: BasicInfoProps) => (
  <>
    {city.state && <Field label="State/Region" value={toTitleCase(city.state)} />}
    {city.suburb && <Field label="Suburb" value={toTitleCase(city.suburb)} />}
  </>
);

export default BasicInfo;
