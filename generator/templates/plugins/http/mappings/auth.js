export default {
  apis: [
    {
      path: '/calls', // 前端path
      to: '/api/server/get_app_node_graph', // 后端path
      method: 'post', 
      params: [ // 传入参数转换
        {
          name: 'time_type',
          value: '$time',
          default: 4
        },
        {
          name: 'node_name_list',
          value: '$apps',
          default: []
        },
        {
          name: 'version',
          value: '$channel',
          default: 1
        }
      ],
      fields: [
      ],
      converts: {
        default: (input) => {
          let result = input
          return result
        }
      }
    }
  ]
}
