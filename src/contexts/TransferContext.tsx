"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface TransferContextType {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  openTransfer: () => void;
  closeTransfer: () => void;
}

const TransferContext = createContext<TransferContextType | undefined>(
  undefined,
);

export function TransferProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const openTransfer = () => setIsExpanded(true);
  const closeTransfer = () => setIsExpanded(false);

  return (
    <TransferContext.Provider
      value={{
        isExpanded,
        setIsExpanded,
        openTransfer,
        closeTransfer,
      }}
    >
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  const context = useContext(TransferContext);
  if (context === undefined) {
    throw new Error("useTransfer must be used within a TransferProvider");
  }
  return context;
}
