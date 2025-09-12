import { all } from 'redux-saga/effects';
import indicatorsWatcher from '../features/countryIndicatorsSaga';
import countriesWatcher from '../features/countriesSaga'; 
import versionWatcher from "../features/versionSaga";
import favouritesWatcher from "../features/favouritesSaga";
export default function* rootSaga() {
  yield all([
    indicatorsWatcher(),  
    countriesWatcher(),   
    versionWatcher(),
    favouritesWatcher(),
    
  ]);
}
