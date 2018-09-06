import Vue from 'vue'
import http from 'vue-http'

Plugin.install = function (Vue, options) {
  Object.defineProperties(Vue.prototype, {
    $http: {
      get () {
        return http
      }
    }
  })
}

Vue.use(Plugin)
export default Plugin
