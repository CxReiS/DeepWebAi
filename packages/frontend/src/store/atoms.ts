import { atom } from "jotai";
import { atomWithImmer } from "jotai-immer";

// Temel, ilkel bir state için normal atom
export const counterAtom = atom(0);

// Karmaşık, iç içe bir state objesi
interface UserProfile {
  id: number;
  name: string;
  settings: {
    theme: "light" | "dark";
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
}

const initialUserProfile: UserProfile = {
  id: 1,
  name: "Kullanıcı",
  settings: {
    theme: "dark",
    notifications: {
      email: true,
      push: false,
    },
  },
};

// Immer ile güçlendirilmiş atom. Bu, güncellemesi en kolay olanıdır.
export const userProfileAtom = atomWithImmer(initialUserProfile);
