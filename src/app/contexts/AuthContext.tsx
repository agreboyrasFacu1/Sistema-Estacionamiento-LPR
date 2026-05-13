import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { User, UserCredential, UserRole } from '../types';
import { MOCK_CREDENTIALS, MOCK_USERS } from '../data/mockData';
import {
  ensureDemoStorageVersion,
  loadFromStorage,
  saveToStorage,
} from '../services/storage';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isTrainingMode: boolean;
  toggleTrainingMode: () => void;
  addUser: (payload: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }) => void;
  updateUser: (user: User, password?: string) => void;
  deleteUser: (id: string) => void;
  toggleUserActive: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  ensureDemoStorageVersion();

  const [users, setUsers] = useState<User[]>(() =>
    loadFromStorage('users', MOCK_USERS)
  );
  const [credentials, setCredentials] = useState<UserCredential[]>(() =>
    loadFromStorage('credentials', MOCK_CREDENTIALS)
  );
  const [user, setUser] = useState<User | null>(() =>
    loadFromStorage<User | null>('current-user', null)
  );
  const [isTrainingMode, setIsTrainingMode] = useState(false);

  useEffect(() => {
    saveToStorage('users', users);
  }, [users]);

  useEffect(() => {
    saveToStorage('credentials', credentials);
  }, [credentials]);

  useEffect(() => {
    saveToStorage('current-user', user);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const latestUser = users.find((item) => item.id === user.id);
    if (!latestUser || !latestUser.isActive) {
      setUser(null);
      return;
    }
    if (latestUser !== user) {
      setUser(latestUser);
    }
  }, [users, user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const normalizedEmail = email.toLowerCase().trim();
    const foundUser = users.find(
      (item) => item.email.toLowerCase() === normalizedEmail && item.isActive
    );
    if (!foundUser) return false;

    const credential = credentials.find((item) => item.userId === foundUser.id);
    if (!credential || credential.password !== password) return false;

    setUser(foundUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsTrainingMode(false);
  };

  const toggleTrainingMode = () => {
    setIsTrainingMode((prev) => !prev);
  };

  const addUser = (payload: {
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: payload.name,
      email: payload.email.toLowerCase().trim(),
      role: payload.role,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    setUsers((prev) => [...prev, newUser]);
    setCredentials((prev) => [
      ...prev,
      { userId: newUser.id, password: payload.password },
    ]);
  };

  const updateUser = (updatedUser: User, password?: string) => {
    setUsers((prev) =>
      prev.map((item) => (item.id === updatedUser.id ? updatedUser : item))
    );
    if (password) {
      setCredentials((prev) =>
        prev.map((item) =>
          item.userId === updatedUser.id ? { ...item, password } : item
        )
      );
    }
  };

  const deleteUser = (id: string) => {
    setUsers((prev) => prev.filter((item) => item.id !== id));
    setCredentials((prev) => prev.filter((item) => item.userId !== id));
    if (user?.id === id) logout();
  };

  const toggleUserActive = (id: string) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        login,
        logout,
        isTrainingMode,
        toggleTrainingMode,
        addUser,
        updateUser,
        deleteUser,
        toggleUserActive,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
