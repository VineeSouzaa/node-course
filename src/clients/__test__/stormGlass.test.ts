import axios from 'axios';
import { StormGlass } from '../stormGlass';
import stormGlassWeather from '@test/fixtures/stormglass_weather_3_hours.json';
import stomrGlassWeatherNormalized from '@test/fixtures/stormglass_normalized_response_3_hours.json';

jest.mock('axios');

describe('StormGLass client', () => {
   
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  it('should return normalized forecast from the stormGlass service', async () => {
    const lat = 33.6498;
    const lng = 151.32165;
    mockedAxios.get.mockResolvedValue({data : stormGlassWeather})
    const stormGlass = new StormGlass(mockedAxios);
    const response = await stormGlass.fetchPoints(lat, lng);
    expect(response).toEqual(stomrGlassWeatherNormalized);
  });

  it('should exclude incomplete data points', async () => {
    const lat = -33.792726;
    const lng = 151.289824;
    const incompleteResponse = {
      hours: [
        {
          windDirection: {
            noaa: 300,
          },
          time: '2020-04-26T00:00:00+00:00',
        },
      ],
    };
    mockedAxios.get.mockResolvedValue({ data: incompleteResponse });

    const stormGlass = new StormGlass(mockedAxios);
    const response = await stormGlass.fetchPoints(lat, lng);

    expect(response).toEqual([]);
  });

  it('should get a generic error from StormGlass service when the request fail before reaching the service', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedAxios.get.mockRejectedValue({ message: 'Network Error' });

    const stormGlass = new StormGlass(mockedAxios);

    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error when trying to communicate to StormGlass'
    );
  });

  it('should get an StormGlassResponseError when the StormGlass service responds with error', async () => {
    const lat = -33.792726;
    const lng = 151.289824;

    mockedAxios.get.mockRejectedValue({
      response: {
        status: 429,
        data: { errors: ['Rate Limit reached'] },
      },
    });

    const stormGlass = new StormGlass(mockedAxios);

    await expect(stormGlass.fetchPoints(lat, lng)).rejects.toThrow(
      'Unexpected error when trying to communicate to StormGlass: Error: {\"errors\":[\"Rate Limit reached\"]} Code: 429'
    );
  });

});