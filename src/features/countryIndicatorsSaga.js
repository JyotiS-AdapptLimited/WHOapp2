import { call, put, takeLatest, all } from 'redux-saga/effects';
import {
  fetchIndicatorsRequest,
  fetchIndicatorsSuccess,
  fetchIndicatorsFailure,
} from './countryIndicatorsSlice';

function fetchIndicatorsApi() {
  return fetch(
    'https://who-drowning.adapptlabs.com/staging/v1/countryIndicators.json',
  ).then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  });
}

function fetchDomainsDef() {
  return fetch(
    'https://who-drowning.adapptlabs.com/staging/v1/indicators-en.json',
  ).then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
}

function* fetchIndicatorsSaga(action) {
  try {
    const countryCode = action.payload;

    // Fetch both APIs in parallel
    const [data, domainsDef] = yield all([
      call(fetchIndicatorsApi),
      call(fetchDomainsDef),
    ]);

    // Find country by ISO code
    const country = data.find(item => item.iso === countryCode);
    if (!country) throw new Error(`No data found for country: ${countryCode}`);

    // Normalize trendsChart
    const years = Array.from(
      { length: country.trendsChart?.[0]?.length || 0 },
      (_, i) => `${2000 + i}`,
    );
    const trends = {
      years,
      total: country.trendsChart?.[0] || [],
      male: country.trendsChart?.[1] || [],
      female: country.trendsChart?.[2] || [],
    };

    // Merge domains with country data
    const mergedDomains = domainsDef
      .map(domain => ({
        ...domain,
        unique_key: domain.unique_key || domain.key,
        progress: country.progress?.[domain.unique_key] ?? 0,
        indicators: (domain.child || []).map(ind => ({
          ...ind,
          unique_key: ind.unique_key || ind.key,
          value: country.indicators?.[ind.unique_key] ?? 'N/A',
        })),
      }))
      .filter(domain => domain.indicators.length > 0);

    const payload = {
      name: country.name || 'Unknown',
      iso: country.iso || countryCode,
      region: country.region || 'N/A',
      indicators: country.indicators || {},
      progress: country.progress || {},
      trendsChart: trends,
      pieChart: {
        values: Array.isArray(country.pieChart?.values)
          ? country.pieChart.values
          : [0, 0, 0, 0, 0, 0],
      },
      domains: mergedDomains,
    };

    yield put(fetchIndicatorsSuccess(payload));
  } catch (error) {
    yield put(fetchIndicatorsFailure(error.message));
  }
}

export default function* indicatorsWatcher() {
  yield takeLatest(fetchIndicatorsRequest.type, fetchIndicatorsSaga);
}
