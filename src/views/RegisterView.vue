<template>
  <div>
    <h1>注册页面</h1>
    <el-form :model="form" ref="form" label-width="80px">
      <el-form-item label="账号">
        <el-input v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item label="密码">
        <el-input type="password" v-model="form.password"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">注册</el-button>
      </el-form-item>
    </el-form>
    <el-dialog :visible.sync="dialogVisible" title="提示">
      <p>{{ dialogMessage }}</p>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogVisible = false">确定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        password: ''
      },
      dialogVisible: false,
      dialogMessage: ''
    };
  },
  methods: {
    submitForm() {
      if (!this.form.username || !this.form.password) {
        this.$message.error('账号和密码不能为空');
        return;
      }

      const message = {
        action: 'register',
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
      if (response.message === 'Registered successfully') {
        this.dialogMessage = '注册成功';
      } else if (response.message === 'Username already registered') {
        this.dialogMessage = '用户名已存在';
      } else {
        this.dialogMessage = '未知错误';
      }
      this.dialogVisible = true;
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
