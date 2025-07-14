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
          <h3>与 {{ activeTab }} 的聊天记录</h3>
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
  </div>
</template>

<script>
export default {
  data() {
    return {
      tabPosition: 'left',
      pals: [], // 存储好友列表
      activeTab: '', // 当前活动的标签
      chats: [], // 存储聊天记录
      messageContent: '' // 存储输入的消息内容
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
          token: this.token
        };
        this.ws.send(JSON.stringify(message));
        this.ws.onmessage = this.handleChatMessage;
      } else {
        this.$message.error('WebSocket未连接');
      }
    },
    handleMessage(event) {
      const response = JSON.parse(event.data);
      if (response.status === 'success' && response.pals) {
        this.pals = response.pals;
        this.$store.dispatch('updateUser', {username: this.username, token: response.token});
      } else {
        this.$message.error('获取好友列表失败');
      }
    },
    handleChatMessage(event) {
      const response = JSON.parse(event.data);

      // 检查消息格式
      if (response.from && response.message) {
        // 如果消息来自当前聊天窗口的用户
        if (response.from === this.activeTab) {
          // 将新消息添加到聊天记录
          this.chats.push([Date.now(), response.from, this.username, response.message, new Date().toISOString()]);
        } else {
          this.$notify({
            title: '新消息',
            message: `来自 ${response.from} 的消息：${response.message}`,
            onClick: () => {
              this.activeTab = response.from;
              this.fetchChats(response.from);
            }
          });
        }
      } else if (response.status === 'success' && response.chats) {
        // 如果是获取聊天记录的响应
        this.chats = response.chats;
        this.$store.dispatch('updateUser', {username: this.username, token: response.token});
      } else {
        this.$message.error('获取聊天记录失败');
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
        this.ws.onmessage = this.handleSendMessageResponse;
      } else {
        this.$message.error('WebSocket未连接');
      }
    },
    handleSendMessageResponse(event) {
      const response = JSON.parse(event.data);
      if (response.status === 'success') {
        this.$message.success('消息发送成功');
        this.$store.dispatch('updateUser', {username: this.username, token: response.token});
        // 更新聊天记录
        this.chats.push([Date.now(), this.username, this.activeTab, this.messageContent, new Date().toISOString()]);
        this.messageContent = ''; // 清空输入框
      } else {
        this.$message.error(response.message || '消息发送失败');
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
  }
};
</script>

<style scoped>
h1 {
  text-align: center;
  margin-bottom: 20px;
}
</style>
