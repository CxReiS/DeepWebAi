/*
 * Tip tanımları: Kullanıcı profili yapısı
 */

export interface UserProfileSettings {
  theme: 'light' | 'dark'
  notifications: {
    email: boolean
  }
}

export interface UserProfile {
  name: string
  settings: UserProfileSettings
}
