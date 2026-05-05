import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProfile, DEFAULT_PROFILE } from "../models/UserProfile";

/**
 * Shared user profile context. Wraps the app so any screen can read
 * or update the profile, and keeps it persisted in AsyncStorage so
 * changes survive app restarts.
 */

const STORAGE_KEY = "USER_PROFILE";

type UserProfileContextType = {
  profile: UserProfile;                                    // Current profile snapshot.
  updateProfile: (updates: Partial<UserProfile>) => void;  // Patch one or more fields.
  clearProfile: () => void;                                // Reset back to the default profile.
};

const UserProfileContext = createContext<UserProfileContextType>({
  profile: DEFAULT_PROFILE,
  updateProfile: () => {},
  clearProfile: () => {},
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  // Load any saved profile on mount and merge it onto the default so missing fields stay sensible.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(data) });
        } catch {}
      }
    });
  }, []);

  // Write through to disk whenever the profile changes.
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

// Convenience hook so screens don't need to import the context directly.
export function useUserProfile() {
  return useContext(UserProfileContext);
}
