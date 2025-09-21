/*
 * Copyright (c) 2025 [DeepWebXs]
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { atom } from "jotai";
import type { UserProfile } from "./userProfileTypes";

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

// Kullanıcı profili atomu: ProfileSettings bileşeninin beklediği şekil
// User profile atom: matches the shape expected by ProfileSettings
export const userProfileAtom = atom<UserProfile>({
  name: "Kullanıcı",
  settings: {
    theme: "light",
    notifications: {
      email: true
    }
  }
});
