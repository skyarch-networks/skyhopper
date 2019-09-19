#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

class ReloadSecretsJob < ApplicationJob
  queue_as :default

  # Ref: https://github.com/rails/rails/blob/634741d9721eb938c8bce38c109023178268e43d/railties/lib/rails/application.rb#L385
  def perform
    Rails.application.remove_instance_variable(:@secrets)
  ensure
    Rails.application.secrets
  end
end
