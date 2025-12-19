import { createRouter, createWebHistory } from "vue-router";
import Home from "./pages/Home.vue";
import Login from "./pages/Login.vue";
import ForgotPassword from "./pages/ForgotPassword.vue";
import Signup from "./pages/Signup.vue";
import List from "./pages/List.vue";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/forgot-password", component: ForgotPassword },
  { path: "/signup", component: Signup },
  { path: "/list", component: List },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
