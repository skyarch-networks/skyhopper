const ModelBase = class ModelBase {
  WrapAndResolveReject(fn) {
    const dfd = $.Deferred();
    const d = fn(dfd);
    d.done(this.resolveF(dfd));
    d.fail(this.rejectF(dfd));
    return dfd.promise();
  }

  Wrap(fn) {
    const dfd = $.Deferred();
    fn(dfd);
    return dfd.promise();
  }

  resolveF(dfd) {
    return function resolve(data) { return dfd.resolve(data); };
  }

  rejectF(dfd) {
    return function reject(xhr) { return dfd.reject(xhr.responseText); };
  }

  wait_change_status(id, dfd, scope) {
    return function wait_change_status() {
      const ws = ws_connector(scope, id);
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
