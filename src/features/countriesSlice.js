import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  countries: [],
  filteredCountries: [],
  groupedCountries: [],
  loading: false,
  error: null,
  search: '',
};

const groupByFirstLetter = (list) => {
  if (!Array.isArray(list)) return [];
  const grouped = {};
  list.forEach(c => {
    const letter = c.name[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });

  return Object.keys(grouped)
    .sort()
    .map(letter => ({
      title: letter,
      data: grouped[letter],
    }));
};

const segmentMap = {
  'A...C': ['A', 'B', 'C'],
  'D...J': ['D', 'E', 'F', 'G', 'H', 'I', 'J'],
  'K...Q': ['K', 'L', 'M', 'N', 'O', 'P', 'Q'],
  'R...Z': ['R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
};

const countriesSlice = createSlice({
  name: 'countries',
  initialState,
  reducers: {
    filterBySegment: (state, action) => {
  const letters = segmentMap[action.payload];

  if (!letters) {
    // No segment selected → reset to all countries
    state.filteredCountries = state.countries;
    state.groupedCountries = groupByFirstLetter(state.countries);
    state.search = '';
    return;
  }
  const filtered = state.countries.filter(c =>
    letters.includes(c.name[0].toUpperCase())
  );
  state.filteredCountries = filtered;
  state.groupedCountries = groupByFirstLetter(filtered);
  state.search = '';
},

    fetchCountriesRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchCountriesSuccess: (state, action) => {
      state.loading = false;
      state.countries = action.payload;
      state.filteredCountries = action.payload;
      state.groupedCountries = groupByFirstLetter(action.payload);
    },
    fetchCountriesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSearch: (state, action) => {
      state.search = action.payload;
  const lowerSearch = action.payload.toLowerCase();
  const filtered = Array.isArray(state.countries)
    ? state.countries.filter(c =>
        c.name.toLowerCase().includes(lowerSearch)
      )
    : [];
  state.filteredCountries = filtered;
  state.groupedCountries = groupByFirstLetter(filtered);
    },
    filterByLetter: (state, action) => {
      const letter = action.payload.toUpperCase();
      const filtered = state.countries.filter(c =>
        c.name.toUpperCase().startsWith(letter)
      );
      state.filteredCountries = filtered;
      state.groupedCountries = groupByFirstLetter(filtered);
      state.search = '';
    },
  },
});

export const {
  fetchCountriesRequest,
  fetchCountriesSuccess,
  fetchCountriesFailure,
  setSearch,
  filterByLetter,
  filterBySegment,
} = countriesSlice.actions;

export default countriesSlice.reducer;
