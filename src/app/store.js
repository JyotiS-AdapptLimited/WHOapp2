import { configureStore } from '@reduxjs/toolkit';
const createSagaMiddleware = require('redux-saga').default;
import countriesReducer from '../features/countriesSlice';
import countryIndicatorsReducer from '../features/countryIndicatorsSlice';
import versionReducer from "../features/versionslice";
import rootSaga from './rootSaga';
import favouritesReducer from "../features/favouritesSlice";
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    countries: countriesReducer,
    indicators: countryIndicatorsReducer,
    version: versionReducer,
    favourites: favouritesReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga);

