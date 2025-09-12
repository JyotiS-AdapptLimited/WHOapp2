import { createSlice } from '@reduxjs/toolkit';

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
    fetchIndicatorsRequest: (state, action) => {
      state.loading = true;
      state.error = null;
    },
    fetchIndicatorsSuccess: (state, action) => {
      console.log('Reducer received indicators test:', action.payload);
      state.loading = false;
      state.selectedCountry = action.payload;

      if (!state.selectedCountry.pieChart) {
        state.selectedCountry.pieChart = { values: [] };
      }
    },
    fetchIndicatorsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedCountry: (state, action) => {
      const match = state.allCountries.find(c => c.iso === action.payload);

      if (state.selectedCountry && !state.selectedCountry.pieChart) {
        state.selectedCountry.pieChart = { values: [] };
      }
    },
  },
});

export const {
  fetchIndicatorsRequest,
  fetchIndicatorsSuccess,
  fetchIndicatorsFailure,
  setSelectedCountry,
} = countryIndicatorsSlice.actions;

export default countryIndicatorsSlice.reducer;
