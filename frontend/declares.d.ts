/// <reference path="ajax_set.d.ts" />
/// <reference path="typings/tsd.d.ts" />

// I18n.t
declare function t(path: string): string;

declare function ws_connector(kind: string, id: string): WebSocket;

declare function bootstrap_confirm(title: string, message: string, status?: string): JQueryDeferred<any>;
