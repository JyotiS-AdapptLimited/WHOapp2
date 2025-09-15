import { createSlice } from '@reduxjs/toolkit';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';

countries.registerLocale(enLocale);
 const specialFlags = {
  ZZA: 'tz', 

};
const normalizeFlagCode = (country) => {
  if (!country) return null;
  if (country.flag) return country.flag.toLowerCase();
  const iso = country.iso;
  if (!iso) return null;
  if (specialFlags[iso]) return specialFlags[iso];
  if (iso.length === 2) return iso.toLowerCase();
  if (iso.length === 3) {
    const converted = countries.alpha3ToAlpha2(iso.toUpperCase());
    return converted ? converted.toLowerCase() : null;
  }
  return null;
};

const initialState = {
  allCountries: [],
  allDomains: [],
  indicators: null,
  loading: false,
  selectedCountry: null,
  error: null,
};

const countryIndicatorsSlice = createSlice({
  name: 'indicators',
  initialState,
  reducers: {
    fetchIndicatorsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchIndicatorsSuccess: (state, action) => {
      state.loading = false;
      const country = action.payload;

      state.selectedCountry = {
        ...country,
        flag: normalizeFlagCode(country), // add normalized flag
        pieChart: country.pieChart || { values: [] },
      };
    },
    fetchIndicatorsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setAllCountries: (state, action) => {
      // Normalize all countries with flag codes
      state.allCountries = action.payload.map(c => ({
        ...c,
        flag: normalizeFlagCode(c),
      }));
    },
    setSelectedCountry: (state, action) => {
      const match = state.allCountries.find(c => c.iso === action.payload);
      if (match) {
        state.selectedCountry = {
          ...match,
          flag: normalizeFlagCode(match),
          pieChart: match.pieChart || { values: [] },
        };
      }
    },
  },
});

export const {
  fetchIndicatorsRequest,
  fetchIndicatorsSuccess,
  fetchIndicatorsFailure,
  setAllCountries,
  setSelectedCountry,
} = countryIndicatorsSlice.actions;

export default countryIndicatorsSlice.reducer;
