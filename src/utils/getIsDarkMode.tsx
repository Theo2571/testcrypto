export const getIsDarkMode = () => {
  try {
    return JSON.parse(localStorage.getItem("isDarkMode") ?? "false");
  } catch {
    return false;
  }
};
