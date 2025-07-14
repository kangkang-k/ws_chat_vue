// store.js
import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    token: null,
    username: null,
    ws: null
  },
  mutations: {
    setUser(state, user) {
      state.token = user.token;
      state.username = user.username;
    },
    setWebSocket(state, ws) {
      state.ws = ws;
    }
  },
  actions: {
    updateUser({ commit }, user) {
      commit('setUser', user);
    },
    initializeWebSocket({ commit }) {
      const ws = new WebSocket('ws://localhost:8765');
      ws.onopen = () => {
        console.log('WebSocket connection established');
      };
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      ws.onclose = () => {
        console.log('WebSocket connection closed');
      };
      commit('setWebSocket', ws);
    }
  },
  getters: {
    getToken: (state) => state.token,
    getUsername: (state) => state.username,
    getWebSocket: (state) => state.ws
  }
});
