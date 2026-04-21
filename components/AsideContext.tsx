import { createContext, SetStateAction} from "react";
import React from 'react';

type SidebarContextType = {
    sidebarOpen: boolean;
    setSidebarOpen: React.Dispatch<SetStateAction<boolean>>;
    listeningHistoryOpen: boolean;
    setListeningHistoryOpen: React.Dispatch<SetStateAction<boolean>>
}

export const AsideContext = createContext<SidebarContextType | null>(null);