/*
 * @Author: Edw4rd
 * @Date: 2020-12-18 13:47:20
 * @LastEditTime: 2020-12-25 11:28:35
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \upload\src\main.js
 */
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import element from 'element-ui'
Vue.config.productionTip = false
Vue.use(element)
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
