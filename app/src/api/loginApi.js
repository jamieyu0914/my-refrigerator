import { useStorage } from "../composables/useStorage";

export async function loginApi(username, password) {
  const { load } = useStorage("users", []);
  const users = await load();
  const user = users.find((u) => u.username === username);
  if (!user) {
    return { success: false, message: "No such user in Preferences!" };
  }
  if (user.password !== password) {
    return { success: false, message: "Password incorrect!" };
  }
  return { success: true, message: "Login successful!" };
}
