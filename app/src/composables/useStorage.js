import { Preferences } from "@capacitor/preferences";

export function useStorage(key, defaultValue = []) {
  const load = async () => {
    const { value } = await Preferences.get({ key });
    return value ? JSON.parse(value) : defaultValue;
  };

  const save = async (data) => {
    await Preferences.set({
      key,
      value: JSON.stringify(data),
    });
  };

  return { load, save };
}
