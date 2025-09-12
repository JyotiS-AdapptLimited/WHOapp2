import { takeEvery, select, call, put } from "redux-saga/effects";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  toggleFavourite,
  setFavourites,
  removeFavourite,
  persistFavourites,
} from "../features/favouritesSlice";

// Save favourites to AsyncStorage
function* saveFavouritesSaga() {
  const favourites = yield select((state) => state.favourites.items);
  try {
    yield call(
      [AsyncStorage, "setItem"],
      "favourites",
      JSON.stringify(favourites)
    );
  } catch (e) {
    console.log("Error saving favourites:", e);
  }
}

// Load favourites from AsyncStorage on app start
function* hydrateFavouritesSaga() {
  try {
    const saved = yield call([AsyncStorage, "getItem"], "favourites");
    if (saved) {
      const parsed = JSON.parse(saved).map(item => ({
        ...item,
        flag: item.flag?.toLowerCase() || null
      }));
      yield put(setFavourites(parsed));
    }
  } catch (e) {
    console.log("Error loading favourites:", e);
  }
}

// Watcher
export default function* favouritesWatcher() {
  yield call(hydrateFavouritesSaga); 
  yield takeEvery(toggleFavourite.type, saveFavouritesSaga);
  yield takeEvery(removeFavourite.type, saveFavouritesSaga);
  yield takeEvery(persistFavourites.type, saveFavouritesSaga);
}
