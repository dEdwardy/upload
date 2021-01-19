import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: () =>
      import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/visualize',
    name: 'Visualize',
    component: () =>
      import(/* webpackChunkName: "visualize" */ '../views/Visualize.vue')
  },
  {
    path: '/record',
    name: 'Record',
    component: () =>
      import(/* webpackChunkName: "record" */ '../views/Record.vue')
  },
  {
    path: '/test',
    name: 'Test',
    component: () =>
      import(/* webpackChunkName: "test" */ '../views/Test.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
