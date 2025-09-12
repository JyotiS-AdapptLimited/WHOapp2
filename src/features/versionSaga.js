// src/features/version/versionSaga.js
import { call, put, takeLatest } from "redux-saga/effects";
import {
  checkVersionRequest,
  checkVersionSuccess,
  checkVersionFailure,
} from "./versionslice";
import DeviceInfo from "react-native-device-info";

function fetchVersion() {
  // can also be API endpoint
  return fetch("[https://who-drowning.adapptlabs.com/staging/v1/version.json](https://who-drowning.adapptlabs.com/staging/v1/version.json)").then((res) => res.json());
}

function* checkVersionSaga() {
  try {
    console.log("Version saga triggered");
    const currentVersion = DeviceInfo.getVersion();
    console.log(" Current Version:", currentVersion);

    const remoteVersion = yield call(fetchVersion);
    console.log("Remote Version:", remoteVersion);
    yield put(checkVersionSuccess({
        currentVersion,
        remoteVersion,
  }));
  } catch (error) {
    console.log(" Version check failed:", error.message);
    yield put(checkVersionFailure(error.message));
  }
}

export default function* versionWatcher() {
  yield takeLatest(checkVersionRequest.type, checkVersionSaga);
}
