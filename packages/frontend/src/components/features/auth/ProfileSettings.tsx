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

import { useAtom } from "jotai";
import { userProfileAtom } from "../../../store/atoms";

export function ProfileSettings() {
  const [userProfile, setUserProfile] = useAtom(userProfileAtom);

  const handleThemeChange = (theme: "light" | "dark") => {
    // Immer yerine immutable update: mevcut state'i kopyalayarak güncelliyoruz
    // Instead of Immer, use immutable update by copying current state
    setUserProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme
      }
    }));
  };

  const toggleEmailNotifications = () => {
    setUserProfile(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        notifications: {
          ...prev.settings.notifications,
          email: !prev.settings.notifications.email
        }
      }
    }));
  };

  return (
    <div>
      <h2>Kullanıcı Ayarları: {userProfile.name}</h2>
      <p>Mevcut Tema: {userProfile.settings.theme}</p>
      <button onClick={() => handleThemeChange("light")}>Açık Tema</button>
      <button onClick={() => handleThemeChange("dark")}>Koyu Tema</button>

      <hr />

      <label>
        <input
          type="checkbox"
          checked={userProfile.settings.notifications.email}
          onChange={toggleEmailNotifications}
        />
        E-posta Bildirimleri
      </label>
    </div>
  );
}
