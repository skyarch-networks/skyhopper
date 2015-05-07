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

  def rescue_exception(ex)
    raise ex unless ajax?

    if ex.respond_to?(:format_error)
      render json: ex.format_error and return
    end

    render json: {
      error: {
        message: ex.message,
        kind:    ex.class.to_s,
      }
    }
  end
end
