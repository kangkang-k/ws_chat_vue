<template>
  <div style="display: flex; height: 400px;">
    <el-tabs
        :tab-position="tabPosition"
        v-model="activeTab"
        @tab-click="handleTabClick"
        style="width: 200px;"
    >
      <el-tab-pane v-for="pal in pals" :key="pal" :label="pal" :name="pal">
      </el-tab-pane>
    </el-tabs>
    <div style="flex: 1; padding: 10px; border-left: 1px solid #eee; display: flex; flex-direction: column;">
      <div style="flex: 1; overflow-y: auto;">
        <div v-if="activeTab">
          <h3>{{ activeTab }}</h3>
          <ul>
            <li v-for="chat in chats" :key="chat[0]">
              <strong>{{ chat[1] }}:</strong> {{ chat[3] }} <em>({{ chat[4] }})</em>
            </li>
          </ul>
        </div>
        <div v-else>
          <p>请选择一个用户查看聊天记录</p>
        </div>
      </div>
      <div style="border-top: 1px solid #eee; padding: 10px;">
        <el-input
            v-model="messageContent"
            placeholder="输入消息..."
            @keyup.enter="sendMessage"
            style="width: calc(100% - 100px); margin-right: 10px;"
        />
        <el-button type="primary" @click="sendMessage">发送</el-button>
      </div>
    </div>
    <el-button type="primary" @click="openChatDialog">发起聊天</el-button>

    <el-dialog
        title="选择用户发起聊天"
        :visible.sync="dialogVisible"
        width="30%"
    >
      <el-select v-model="selectedUser" placeholder="选择用户">
        <el-option
            v-for="user in allUsers"
            :key="user"
            :label="user"
            :value="user"
        />
      </el-select>
      <el-input
          v-model="newMessageContent"
          placeholder="输入消息..."
          style="margin-top: 10px;"
      />
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="sendNewMessage">发送</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tabPosition: 'left',
      pals: [],
      activeTab: '',
      chats: [],
      messageContent: '',
      dialogVisible: false,
      allUsers: [],
      selectedUser: '',
      newMessageContent: ''
    };
  },
  computed: {
    username() {
      return this.$store.getters.getUsername;
    },
    token() {
      return this.$store.getters.getToken;
    },
    ws() {
      return this.$store.getters.getWebSocket;
    }
  },
  methods: {
    fetchPals() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = {
          action: 'pals',
          username: this.username,
          token: this.token
        };
        this.ws.send(JSON.stringify(message));
        this.ws.onmessage = this.handleMessage;
      } else {
        this.$message.error('WebSocket未连接');
      }
    },
    fetchChats(to) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = {
          action: 'chats',
          username: this.username,
          to: to,
          token: this.$store.getters.getToken
        };
        this.ws.send(JSON.stringify(message));
      } else {
        this.$message.error('WebSocket未连接');
      }
    },
    fetchAllUsers() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = {
          action: 'users',
          username: this.username,
          token: this.$store.getters.getToken
        };
        this.ws.send(JSON.stringify(message));
      } else {
        this.$message.error('WebSocket未连接');
      }
    },
    handleMessage(event) {
      const response = JSON.parse(event.data);
      console.log(response);
      if (response.from && response.message) {
        if (response.from === this.activeTab) {
          this.chats.push([Date.now(), response.from, this.username, response.message, new Date().toISOString()]);
          this.activeTab = response.from;
          this.fetchChats(response.from);
          this.$store.dispatch('updateUser', {username: this.username, token: response.token});
        } else {
          this.$notify({
            title: '新消息',
            message: `来自 ${response.from} 的消息：${response.message}`,
            onClick: () => {
              this.activeTab = response.from;
              this.fetchChats(response.from);
            }
          });
          this.$store.dispatch('updateUser', {username: this.username, token: response.token});
        }
        // 刷新好友列表
        this.fetchPals();
      } else if (response.status === 'success') {
        // 处理成功响应
        if (response.pals) {
          this.pals = response.pals;
        } else if (response.chats) {
          this.chats = response.chats;
        } else if (response.users) {
          this.allUsers = response.users;
        }
        this.$store.dispatch('updateUser', {username: this.username, token: response.token});
      } else {
        this.$message.error(response.message || '操作失败');
      }
    },
    handleTabClick(tab) {
      this.activeTab = tab.name;
      this.fetchChats(tab.name);
    },
    sendMessage() {
      if (!this.messageContent.trim()) {
        this.$message.error('消息内容不能为空');
        return;
      }
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = {
          action: 'chat',
          sender: this.username,
          receiver: this.activeTab,
          content: this.messageContent,
          token: this.token
        };
        this.ws.send(JSON.stringify(message));
      } else {
        this.$message.error('WebSocket未连接');
      }
    },
    openChatDialog() {
      this.fetchAllUsers();
      this.dialogVisible = true;
    },
    sendNewMessage() {
      if (!this.selectedUser) {
        this.$message.error('请选择一个用户');
        return;
      }
      if (!this.newMessageContent.trim()) {
        this.$message.error('消息内容不能为空');
        return;
      }
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const message = {
          action: 'chat',
          sender: this.username,
          receiver: this.selectedUser,
          content: this.newMessageContent,
          token: this.token
        };
        this.ws.send(JSON.stringify(message));
      } else {
        this.$message.error('WebSocket未连接');
      }
    }
  },
  mounted() {
    if (!this.ws) {
      this.$store.dispatch('initializeWebSocket').then(() => {
        this.fetchPals();
      });
    } else {
      this.fetchPals();
    }

    // 统一在mounted中设置WebSocket的onmessage处理器
    if (this.ws) {
      this.ws.onmessage = this.handleMessage;
    }
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 20px;
}
</style>
