import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, DEFAULT_PROFILE } from "../models/UserProfile";

const STORAGE_KEY = "USER_PROFILE";

type UserProfileContextType = {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  clearProfile: () => void;
};

const UserProfileContext = createContext<UserProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  clearProfile: () => {},
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(data) });
        } catch {}
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const clearProfile = () => {
    setProfile(DEFAULT_PROFILE);
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile, clearProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
