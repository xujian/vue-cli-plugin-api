import http from 'vue-cli-plugin-http'
import mappings from './mappings'

let __config = {
  real: {
    scheme: '//',
    host: 'product-line.huishoubao.com.cn',
    base: '/pushApp'
  },
  mock: {
    scheme: '//',
    host: 'api.huishoubao.com'
  },
  // 装箱 将restful参数组装成后端参数格式
  boxing: input => {
    let output = {
      _head: {
        _interface: 'det_getProfessionDetect',
        _msgType: 'request',
        _remark: '',
        _timestamps: '',
        _version: '1.0.0'
      },
      _param: {
      }
    }
    Object.keys(input).forEach(f => { // 将_开头的复制到_head
      if (f.startsWith('_')) {
        output._head[f] = input[f]
        delete input[f]
      }
    })
    output._param = input
    return output
  },
  // 拆箱 从后端直接返回的原始数据结构取出code/data
  unboxing: input => {
    let output = {
      code: input._data._retcode,
      data: input._data._data // 之后进入fields匹配
    }
    return output
  }
}

http.setup({
  config: __config,
  mappings: mappings
})

export default ({app, router, Vue}) => {
  Vue.prototype.$http = http
}
