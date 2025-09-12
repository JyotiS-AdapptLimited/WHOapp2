import { call, put, takeLatest } from 'redux-saga/effects';
import {
  fetchCountriesRequest,
  fetchCountriesSuccess,
  fetchCountriesFailure,
} from './countriesSlice';

function fetchCountriesApi() {
  return fetch('https://who-drowning.adapptlabs.com/staging/v1/countries-en.json',)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    });
}

function* fetchCountriesSaga() {
  try {
    console.log('[Saga] Fetching countries...');
    const countries = yield call(fetchCountriesApi);
    console.log('[Saga] Success:', countries.length);
    yield put(fetchCountriesSuccess(countries));
  } catch (error) {
    console.error('[Saga] Error:', error.message);
    yield put(fetchCountriesFailure(error.message));
  }
}

export default function* countriesWatcher() {
  yield takeLatest(fetchCountriesRequest.type, fetchCountriesSaga);
}
