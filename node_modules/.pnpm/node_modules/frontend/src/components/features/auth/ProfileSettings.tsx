import { useImmerAtom } from "jotai-immer";
import { userProfileAtom } from "../../../store/atoms";

export function ProfileSettings() {
  const [userProfile, setUserProfile] = useImmerAtom(userProfileAtom);

  const handleThemeChange = (theme: "light" | "dark") => {
    // Immer sayesinde state'i böyle kolayca güncelleyebilirsiniz!
    // Spreading yapmaya gerek yok (...userProfile, settings: { ...userProfile.settings, theme: newTheme })
    setUserProfile((draft) => {
      draft.settings.theme = theme;
    });
  };

  const toggleEmailNotifications = () => {
    setUserProfile((draft) => {
      draft.settings.notifications.email = !draft.settings.notifications.email;
    });
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
