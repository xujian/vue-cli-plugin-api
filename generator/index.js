module.exports = (api, options, rootOptions) => {
    api.extendPackage({
      devDependencies: {
        axios: "^0.18.0"
      }
    });
  
    api.render(
      {
        "./src/plugins/api.js": "./templates/plugins/api.js"
      },
      options
    );
  
    const fs = require("fs");
    const helpers = require('./helpers')(api)
  
    api.onCreateComplete(() => {
      helpers.updateMain(src => {
        let vueImportIndex = src.findIndex(line => line.match(/^import Vue/));
        let axiosImportIndex = src.findIndex(line => line.match(/\/plugins\/api/));
        if(axiosImportIndex < 0){
          src.splice(++vueImportIndex, 0, "import './plugins/api'");
        }      
        return src;
      });
    });
  };
  