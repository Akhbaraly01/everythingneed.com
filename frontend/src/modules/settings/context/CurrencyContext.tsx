import { createContext, useContext, useState, ReactNode } from "react";

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate relative to USD
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const currencies: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", rate: 1550 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 149 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 7.24 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 83.12 },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: 3.67 },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", rate: 3.75 },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", rate: 4.97 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.36 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.53 },
  { code: "KRW", symbol: "₩", name: "South Korean Won", rate: 1320 },
  { code: "ZAR", symbol: "R", name: "South African Rand", rate: 18.5 },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", rate: 12.5 },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", rate: 153 },
];

const languages: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "sw", name: "Swahili", nativeName: "Kiswahili", flag: "🇰🇪" },
  { code: "ha", name: "Hausa", nativeName: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yoruba", nativeName: "Yorùbá", flag: "🇳🇬" },
];

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  currencies: Currency[];
  language: Language;
  setLanguage: (language: Language) => void;
  languages: Language[];
  convertPrice: (priceInUSD: number) => number;
  formatPrice: (priceInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>(currencies[0]);
  const [language, setLanguage] = useState<Language>(languages[0]);

  const convertPrice = (priceInUSD: number): number => {
    return priceInUSD * currency.rate;
  };

  const formatPrice = (priceInUSD: number): string => {
    const converted = convertPrice(priceInUSD);
    return `${currency.symbol}${converted.toLocaleString(undefined, { 
      minimumFractionDigits: currency.rate >= 100 ? 0 : 2,
      maximumFractionDigits: currency.rate >= 100 ? 0 : 2
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      currencies,
      language,
      setLanguage,
      languages,
      convertPrice,
      formatPrice,
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
