import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

type Language = 'en' | 'es' | 'fr';

const translations = {
  en: {
    chats: 'Chats',
    activity: 'Activity',
    analytics: 'Analytics',
    settings: 'Settings',
    search: 'Search messages or users...',
    typeMessage: 'Type a message...',
    encrypted: 'End-to-End Encrypted',
    offline: 'Offline Mode Active',
    signIn: 'Sign in with Google',
    logout: 'Log out',
    theme: 'Theme',
    language: 'Language',
    biometric: 'Biometric Authentication',
    cloudBackup: 'Cloud Backup',
    exportData: 'Export Data',
    noMessages: 'No messages yet. Start a conversation!',
  },
  es: {
    chats: 'Chats',
    activity: 'Actividad',
    analytics: 'Analítica',
    settings: 'Ajustes',
    search: 'Buscar mensajes o usuarios...',
    typeMessage: 'Escribe un mensaje...',
    encrypted: 'Cifrado de extremo a extremo',
    offline: 'Modo sin conexión activo',
    signIn: 'Iniciar sesión con Google',
    logout: 'Cerrar sesión',
    theme: 'Tema',
    language: 'Idioma',
    biometric: 'Autenticación biométrica',
    cloudBackup: 'Copia de seguridad',
    exportData: 'Exportar datos',
    noMessages: 'Aún no hay mensajes. ¡Inicia una conversación!',
  },
  fr: {
    chats: 'Discussions',
    activity: 'Activité',
    analytics: 'Analytique',
    settings: 'Paramètres',
    search: 'Rechercher des messages ou utilisateurs...',
    typeMessage: 'Tapez un message...',
    encrypted: 'Chiffrement de bout en bout',
    offline: 'Mode hors ligne actif',
    signIn: 'Se connecter avec Google',
    logout: 'Déconnexion',
    theme: 'Thème',
    language: 'Langue',
    biometric: 'Authentification biométrique',
    cloudBackup: 'Sauvegarde Cloud',
    exportData: 'Exporter les données',
    noMessages: 'Aucun message pour le moment. Commencez une conversation !',
  }
};

interface I18nContextType {
  t: (key: keyof typeof translations.en) => string;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { appUser, updateAppUser } = useAuth();
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    if (appUser?.language && ['en', 'es', 'fr'].includes(appUser.language)) {
      setLanguageState(appUser.language as Language);
    }
  }, [appUser?.language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (appUser) {
      updateAppUser({ language: lang });
    }
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[language][key] || translations.en[key];
  };

  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) throw new Error('useI18n must be used within an I18nProvider');
  return context;
};
