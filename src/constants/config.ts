import Constants from "expo-constants";

const getBackendUrls = () => {
  let host = "localhost";
  if (Constants.expoConfig?.hostUri) {
    host = Constants.expoConfig.hostUri.split(':')[0];
  }
  return {
    api: `http://${host}:3000`,
    ws: `ws://${host}:3000`
  };
};

export const URLS = getBackendUrls();
export const API_URL = URLS.api;
export const WS_URL = URLS.ws;
