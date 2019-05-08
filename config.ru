# This file is used by Rack-based servers to start the application.

require ::File.expand_path('../config/environment', __FILE__)
if Rails.env.development?
  require 'rack/contrib/profiler'
  use Rack::Profiler
end
run Rails.application
