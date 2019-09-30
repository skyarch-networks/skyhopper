const ModelBase = class ModelBase {
  WrapAndResolveReject(fn) { // eslint-disable-line class-methods-use-this
    const dfd = $.Deferred();
    const d = fn(dfd);
    d.done(ModelBase.resolveF(dfd));
    d.fail(ModelBase.rejectF(dfd));
    return dfd.promise();
  }

  static resolveF(dfd) {
    return function resolve(data) { return dfd.resolve(data); };
  }

  static rejectF(dfd) {
    return function reject(xhr) { return dfd.reject(xhr.responseText); };
  }

  static wait_change_status(id, dfd, scope) {
    return function wait_change_status() {
      const ws = wsConnector(scope, id);
      ws.onmessage = function onmessage(msg) {
        const d = JSON.parse(msg.data);
        if (!d.status) {
          dfd.reject(d.message);
        } else {
          dfd.resolve(d);
        }
        ws.close();
      };
    };
  }
};
Object.defineProperty(exports, '__esModule', { value: true });
exports.default = ModelBase;
