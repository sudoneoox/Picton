import React, { createContext, useContext, useState, useEffect } from "react";

// This react component is primarily being used in order to keep track of sitewide
// configurations like a Dark/Light Mode and also to toggle between which active tab is being displayed
// this is done since we are hosting our page in github pages which only allows static websites
//

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  activeRoute: string;
  setActiveRoute: (route: string) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  activeRoute: "home",
  setActiveRoute: () => {},
});

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") === "dark";
    }
    return false;
  });

  const [activeRoute, setActiveRoute] = useState("home");

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <ThemeContext.Provider
      value={{ isDarkMode, toggleDarkMode, activeRoute, setActiveRoute }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
