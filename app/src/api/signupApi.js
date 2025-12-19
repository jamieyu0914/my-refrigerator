import { useStorage } from "../composables/useStorage";

export async function signupApi(username, password, confirmPassword) {
  const { load, save } = useStorage("users", []);
  if (!username || !password || !confirmPassword) {
    return { success: false, message: "Please fill all fields." };
  }
  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match!" };
  }
  const users = await load();
  if (users.find((u) => u.username === username)) {
    return { success: false, message: "Username already exists!" };
  }
  users.push({ username, password });
  await save(users);
  return { success: true, message: "Signup successful! Please login." };
}
