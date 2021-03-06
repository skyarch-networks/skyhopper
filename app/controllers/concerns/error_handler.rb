#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# @markup markdown
# ErrorHandler is module of controller error handling.
#
## コントローラーでのエラーハンドリングの方法
#
# コントローラーで`raise`された`StandardError`以下のエラーは、`#rescue_exception`によって処理されます。
# もし、リクエストがAjaxでなければ、通常通り例外が吐かれます。
# リクエストがAjaxであれば、適切にフォーマットされたJSONとして`render`されます。
#
### フォーマットの方法
#
# 特に指定のない例外クラスの場合、以下の様な書式で例外が吐かれます。また、ステータスコードは500固定です。
#
# ```json
# {
#   "error": {
#     "message": "ex.message",
#     "kind":    "ex.class.to_s"
#   }
# }
# ```
#
# この挙動は、例外クラスの`#format_error`と`#status_code`メソッドをオーバーライドすることによって変更することが出来ます。
#
# `#format_error`ではレスポンスの`error`の中身を返します。
# 少なくとも`message`と`kind`の2つのキーを持った`Hash`を返すようにしてください。
#
# `#status_code`ではステータスコードを返します。
#
#
### クライアント側での処理の仕方
#
# クライアント側では、`modal.AlertForAjaxStdError`メソッドを使用することで簡単にエラーを表示することが出来ます。
# 詳細は`helper.js`を参照してください。
module Concerns::ErrorHandler
  extend ActiveSupport::Concern
  using ErrorHandlize
  include Concerns::ControllerUtil

  included do
    rescue_from StandardError, with: :rescue_exception
  end

  private

  # Ajax での通信かどうかを判定し、True/False で返す。
  # @return [Boolean]
  def ajax?
    request.headers[:HTTP_X_REQUESTED_WITH] == 'XMLHttpRequest'
  end

  # Ajax でのアクセスでなければ、渡された例外を投げる。
  # Ajax のアクセスであれば、例外を JSON に整形して render する
  # @param [Exception] exception
  def rescue_exception(exception)
    Rails.logger.error(exception.inspect + ' from ' + exception.backtrace.first)
    Rails.logger.debug(exception.backtrace.join("\n"))
    raise exception if exception.is_a? Sprockets::FileNotFound # prevent redirect loop

    if ajax?
      render json: { error: exception.format_error }, status: exception.status_code and return
    else
      flash[:alert] = exception.format_error[:message]
      redirect_to_back_or_root
    end
  end
end
