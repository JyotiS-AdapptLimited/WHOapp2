// src/features/version/versionSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  currentVersion: null, // hardcoded OR read from app.json
  remoteVersion: null,
  needsUpdate: false,
  error: null,
};

const versionSlice = createSlice({
  name: "version",
  initialState,
  reducers: {
    checkVersionRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    checkVersionSuccess: (state, action) => {
      state.loading = false;
      state.currentVersion = action.payload.currentVersion;
      state.remoteVersion = action.payload.version;
      state.needsUpdate = action.payload.version !== state.currentVersion;
    },
    checkVersionFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  checkVersionRequest,
  checkVersionSuccess,
  checkVersionFailure,
} = versionSlice.actions;

export default versionSlice.reducer;
