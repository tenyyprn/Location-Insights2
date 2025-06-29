import React, { createContext, useContext, useState, ReactNode } from 'react';

interface HousingScore {
  交通利便性: number;
  買い物利便性: number;
  飲食店: number;
  医療福祉: number;
  教育環境: number;
  安全性: number;
  環境快適性: number;
  文化娯楽: number;
}

interface AddressContextType {
  currentAddress: string;
  setCurrentAddress: (address: string) => void;
  housingScores: HousingScore | null;
  setHousingScores: (scores: HousingScore) => void;
  coordinates: { lat: number; lng: number } | null;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
}

const AddressContext = createContext<AddressContextType | undefined>(undefined);

interface AddressProviderProps {
  children: ReactNode;
}

export const AddressProvider: React.FC<AddressProviderProps> = ({ children }) => {
  const [currentAddress, setCurrentAddress] = useState<string>('東京都渋谷区神南1-23-10');
  const [housingScores, setHousingScores] = useState<HousingScore | null>({
    交通利便性: 85,
    買い物利便性: 92,
    飲食店: 88,
    医療福祉: 74,
    教育環境: 70,
    安全性: 75,
    環境快適性: 62,
    文化娯楽: 68
  });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>({
    lat: 35.6628,
    lng: 139.7039
  });

  return (
    <AddressContext.Provider
      value={{
        currentAddress,
        setCurrentAddress,
        housingScores,
        setHousingScores,
        coordinates,
        setCoordinates,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
};

export const useAddress = (): AddressContextType => {
  const context = useContext(AddressContext);
  if (context === undefined) {
    throw new Error('useAddress must be used within an AddressProvider');
  }
  return context;
};
