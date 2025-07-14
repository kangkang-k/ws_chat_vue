<template>
  <div>
    <h1>主页</h1>
    <el-button type="primary" @click="goToLogin">登录</el-button>
    <el-button type="success" @click="goToRegister">注册</el-button>
  </div>
</template>

<script>
export default {
  name: 'HomePage',
  methods: {
    goToLogin() {
      this.$router.push({ name: 'Login' });
    },
    goToRegister() {
      this.$router.push({ name: 'Register' });
    }
  },
  mounted() {
    this.$store.dispatch('initializeWebSocket');
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 20px;
}
</style>
