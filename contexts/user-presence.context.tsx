"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type PresenceMap = Record<string, boolean>;

interface UserPresenceContextType {
  presenceMap: PresenceMap;
  setPresenceMap: (map: PresenceMap) => void;
  updatePresence: (userId: string, isOnline: boolean) => void;
  isUserOnline: (userId: string) => boolean;
}

const UserPresenceContext = createContext<UserPresenceContextType | undefined>(undefined);

export const UserPresenceProvider = ({ children }: { children: ReactNode }) => {
  const [presenceMap, setPresenceMapState] = useState<PresenceMap>({});

  const setPresenceMap = (map: PresenceMap) => {
    setPresenceMapState(map);
  };

  const updatePresence = (userId: string, isOnline: boolean) => {
    setPresenceMapState(prev => ({ ...prev, [userId]: isOnline }));
  };

  const isUserOnline = (userId: string) => {
    return !!presenceMap[userId];
  };

  return (
    <UserPresenceContext.Provider value={{ presenceMap, setPresenceMap, updatePresence, isUserOnline }}>
      {children}
    </UserPresenceContext.Provider>
  );
};

export const useUserPresence = (): UserPresenceContextType => {
  const context = useContext(UserPresenceContext);
  if (!context) {
    throw new Error("useUserPresence must be used within a UserPresenceProvider");
  }
  return context;
};
