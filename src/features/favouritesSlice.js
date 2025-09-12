import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const favouritesSlice = createSlice({
  name: "favourites",
  initialState,
  reducers: {
    setFavourites: (state, action) => {
      state.items = action.payload;
    },
    toggleFavourite: (state, action) => {
      const country = action.payload;
      const exists = state.items.find((item) => item.code === country.code);
      if (exists) {
        state.items = state.items.filter((item) => item.code !== country.code);
      } else {
        state.items.push(country);
      }
    },
    removeFavourite: (state, action) => {
      state.items = state.items.filter((item) => item.code !== action.payload);
    },
    persistFavourites: (state, action) => {
      // this action exists only for saga, no state change needed here
    },
  },
});

export const { toggleFavourite, setFavourites, removeFavourite, persistFavourites } =
  favouritesSlice.actions;

export default favouritesSlice.reducer;
