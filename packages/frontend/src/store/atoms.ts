import { atom } from "jotai";

// Örnek bir veri tipi, bunu shared-types paketinden alabilirsiniz
interface DashboardData {
  userCount: number;
  activeSessions: number;
  latestMessage: string;
}

// Dashboard verisini, yüklenme ve hata durumlarını tutacak atomlar
export const dashboardDataAtom = atom<DashboardData | null>(null);
export const dashboardLoadingAtom = atom<boolean>(true);
export const dashboardErrorAtom = atom<string | null>(null);
