module Concerns::ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from StandardError, with: :rescue_exception
  end

  private

  # Ajax での通信かどうかを判定し、True/False で返す。
  # @return [Boolean]
  def ajax?
    return request.headers[:HTTP_X_REQUESTED_WITH] == 'XMLHttpRequest'
  end

  # Ajax でのアクセスでなければ、渡された例外を投げる。
  # Ajax のアクセスであれば、例外を JSON に整形して render する
  # @param [Exception] ex
  def rescue_exception(ex)
    raise ex unless ajax?

    if ex.respond_to?(:format_error) and ex.respond_to?(:status_code)
      render json: ex.format_error, status: ex.status_code and return
    end

    render json: { error: {
        message: ex.message,
        kind:    ex.class.to_s,
    }}, status: 500
  end
end
