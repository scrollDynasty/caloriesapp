import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const AVATAR_URI_KEY = "profile.avatarUri";

type AvatarListener = (uri: string | null) => void;

let cachedAvatarUri: string | null = null;
let hasLoadedAvatar = false;
let loadPromise: Promise<string | null> | null = null;
const listeners = new Set<AvatarListener>();

const notify = () => {
  for (const listener of listeners) {
    listener(cachedAvatarUri);
  }
};

export const getAvatarUri = () => cachedAvatarUri;

export const loadAvatarUri = async (): Promise<string | null> => {
  if (hasLoadedAvatar) return cachedAvatarUri;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const value = await AsyncStorage.getItem(AVATAR_URI_KEY);
      cachedAvatarUri = value || null;
      hasLoadedAvatar = true;
      notify();
      return cachedAvatarUri;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
};

export const setAvatarUri = async (uri: string | null) => {
  cachedAvatarUri = uri;
  hasLoadedAvatar = true;
  notify();

  if (uri) {
    await AsyncStorage.setItem(AVATAR_URI_KEY, uri);
  } else {
    await AsyncStorage.removeItem(AVATAR_URI_KEY);
  }
};

export const subscribeAvatarUri = (listener: AvatarListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useAvatarUri = () => {
  const [uri, setUri] = useState<string | null>(() => cachedAvatarUri);

  useEffect(() => {
    loadAvatarUri().catch(() => undefined);
    return subscribeAvatarUri(setUri);
  }, []);

  return uri;
};
