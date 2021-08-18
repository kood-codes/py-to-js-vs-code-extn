declare var py_to_js_module: {
  toJavaScript: (param: any) => any;
  getJsAst: (param: any) => any;
};

declare module "py-to-js" {
  export = py_to_js_module;
}
