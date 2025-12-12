<template>
  <div class="container">
    <button @click="goToLogin" class="enter-btn">
    <span>ENTER</span>
    <svg width="15px" height="10px" viewBox="0 0 13 10">
        <path d="M1,5 L11,5"></path>
        <polyline points="8 1 12 5 8 9"></polyline>
    </svg>
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const goToLogin = () => {
  router.push('/login')
}
</script>

<style>
.container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  font-family: Arial;
}

.enter-btn {
  position: relative;
  margin: auto;
  padding: 12px 18px;
  transition: all 0.2s ease;
  border: none;
  background: none;
  cursor: pointer;
  margin: 100px 0 0 0;
}

.enter-btn:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  border-radius: 50px;
  background: #f9f9f9;
  border: 2px solid rgba(255, 255, 255, 0.2);
  width: 45px;
  height: 45px;
  transition: all 0.3s ease;
}

.enter-btn span {
  position: relative;
  font-family: "Ubuntu", sans-serif;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #000000;
}

.enter-btn svg {
  position: relative;
  top: 0;
  margin-left: 10px;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke: #000000;
  stroke-width: 2;
  transform: translateX(-5px);
  transition: all 0.3s ease;
}

.enter-btn:hover:before {
  width: 100%;
  background: #f9f9f9;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.enter-btn:hover svg {
  transform: translateX(0);
}

.enter-btn:active {
  transform: scale(0.95);
}

</style>