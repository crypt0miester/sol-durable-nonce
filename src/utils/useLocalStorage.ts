type UseStorageReturnValue = {
  getItem: (key: string) => string;
  setItem: (key: string, value: string) => boolean;
  removeItem: (key: string) => void;
};

const fs = (() => {
  try {
    return require("fs");
  } catch (err) {
    return null;
  }
})();

const path = (() => {
  try {
    return require("path");
  } catch (err) {
    return null;
  }
})();

const filePath = path ? path.join("durableNonceConfig.json") : null;

const readFileData = () => {
  if (fs && filePath) {
    try {
      return fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      // fail silently
      // console.warn(err);
      return "{}";
    }
  }
  return "{}";
};

const writeFileData = (data: string) => {
  if (fs && filePath) {
    try {
      fs.writeFileSync(filePath, data);
    } catch (err) {
      // fail silently
      // console.warn(err);
    }
  }
};

let data = readFileData();

export const useLocalStorage = (): UseStorageReturnValue => {
  const isBrowser = typeof window !== "undefined";

  const getItem = (key: string): string => {
    if (isBrowser) {
      return window.localStorage[key] || "";
    } else {
      try {
        const storage = JSON.parse(data);
        return storage[key] || "";
      } catch (err) {
        // fail silently
        // console.warn(err);
        return "";
      }
    }
  };

  const setItem = (key: string, value: string): boolean => {
    if (isBrowser) {
      window.localStorage.setItem(key, value);
      return true;
    } else {
      try {
        const storage = JSON.parse(data);
        storage[key] = value;
        data = JSON.stringify(storage);
        writeFileData(data);
        return true;
      } catch (err) {
        // fail silently
        // console.error(err);
        return false;
      }
    }
  };

  const removeItem = (key: string): void => {
    if (isBrowser) {
      window.localStorage.removeItem(key);
    } else {
      try {
        const storage = JSON.parse(data);
        delete storage[key];
        data = JSON.stringify(storage);
        writeFileData(data);
      } catch (err) {
        // fail silently
        // console.error(err);
      }
    }
  };

  return { getItem, setItem, removeItem };
};
