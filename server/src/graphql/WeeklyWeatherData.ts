import { objectType, queryField, nonNull, stringArg, floatArg } from 'nexus';

// Week data point type
export const WeekDataPoint = objectType({
  name: 'WeekDataPoint',
  definition(t) {
    t.nonNull.int('week');
    t.float('avgTemp');
    t.float('maxTemp');
    t.float('minTemp');
    t.float('totalPrecip');
    t.float('avgPrecip');
    t.int('daysWithRain');
    t.nonNull.int('daysWithData');
  },
});

// City weekly weather type
export const CityWeeklyWeather = objectType({
  name: 'CityWeeklyWeather',
  definition(t) {
    t.nonNull.string('city');
    t.nonNull.string('country');
    t.string('state');
    t.float('lat');
    t.float('long');
    t.nonNull.list.nonNull.field('weeklyData', {
      type: 'WeekDataPoint',
    });
  },
});

// Query
export const weeklyWeatherByCityQuery = queryField('weeklyWeatherByCity', {
  type: 'CityWeeklyWeather',
  args: {
    city: nonNull(stringArg()),
    lat: floatArg(),
    long: floatArg(),
  },
  async resolve(_root, args, ctx) {
    // Find city with weekly weather
    const city = await ctx.prisma.city.findFirst({
      where: {
        name: { equals: args.city, mode: 'insensitive' },
        ...(args.lat !== undefined &&
          args.long !== undefined && {
            lat: args.lat,
            long: args.long,
          }),
      },
      include: {
        weeklyWeather: true,
      },
    });

    if (!city || !city.weeklyWeather) {
      return null;
    }

    return {
      city: city.name,
      country: city.country,
      state: city.state,
      lat: city.lat,
      long: city.long,
      weeklyData: city.weeklyWeather.weeklyData as any[], // JSON to array
    };
  },
});
