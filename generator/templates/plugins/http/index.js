import http from 'vue-http'
import mappings from './mappings'

Plugin.install = function(Vue, options) {
  Object.defineProperties(Vue.prototype, {
    $http: {
      get() {
        return http
      }
    }
  });
};

Vue.use(Plugin)

export default Plugin;
