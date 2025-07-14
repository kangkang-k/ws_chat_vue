<template>
  <div>
    <h1>登录页面</h1>
    <el-form :model="form" ref="form" label-width="80px">
      <el-form-item label="账号">
        <el-input v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="form.password"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitLogin">登录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        password: ''
      }
    };
  },
  methods: {
    submitLogin() {
      if (!this.form.username || !this.form.password) {
        this.$message.error('账号和密码不能为空');
        return;
      }

      const message = {
        action: 'login',
        username: this.form.username,
        password: this.form.password
      };

      const ws = this.$store.getters.getWebSocket;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        ws.onmessage = this.handleMessage;
      } else {
        this.$message.error('WebSocket未连接');
      }
    },
    handleMessage(event) {
      const response = JSON.parse(event.data);
      if (response.message === 'Login successful') {
        this.$store.dispatch('updateUser', {
          token: response.token,
          username: this.form.username
        });
        this.$message.success('登录成功');
        this.$router.push('/chat');
      } else if (response.message === 'User not found') {
        this.$message.error('用户不存在');
      } else if (response.message === 'Wrong password') {
        this.$message.error('密码错误');
      } else {
        this.$message.error('未知错误');
      }
    }
  }
};
</script>
<style scoped>
h1 {
  text-align: center;
  margin-top: 20px;
}
</style>
