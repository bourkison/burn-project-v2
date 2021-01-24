import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { auth } from './firebase'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false

new Vue({
  router,
  store,
  render: h => h(App),
  vuetify,
  created() {}
}).$mount('#app')

auth.onAuthStateChanged(function(user) {
  store.dispatch("fetchUser", user)
})