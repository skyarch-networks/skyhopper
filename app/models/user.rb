#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'digest/sha2'

class User < ActiveRecord::Base
  has_many :cf_templates,         dependent: :nullify
  has_many :infrastructure_logs,  dependent: :nullify

  has_many :user_projects
  has_many :projects, through: :user_projects

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable,
         :registerable,
         # :recoverable,
         :rememberable,
         :trackable,
         :validatable

  extend Concerns::Cryptize
  cryptize :mfa_secret_key

  def self.can_sign_up?
    self.where(admin: true, master: true).empty?
  end

  def master?
    master
  end

  def admin?
    admin
  end

  def allow?(project_or_infra)
    return true if master?
    return case project_or_infra
    when Project
      self.project_ids.include?(project_or_infra.id)
    when Infrastructure
      allow?(project_or_infra.project)
    end
  end

  def create_project(client)
    prj = Project.new(
      client: client,
      name: email,
      code: email,
      access_key: DummyText,
      secret_access_key: DummyText,
      cloud_provider: CloudProvider.aws
    )
    if prj.save
      UserProject.create(user_id: self.id, project_id: prj.id)
    end
    return prj
  end

  # WebSocket のエンドポイントに使用する文字列を返す
  # @return [String]
  def ws_key
    Digest::SHA256.hexdigest(self.email + self.encrypted_password + self.current_sign_in_at.to_s)
  end

  # @return [Hash{Symbol => Any}] Attributes trimed password
  def trim_password
    ret = attributes.symbolize_keys
    ret.delete(:encrypted_password)
    ret.delete(:mfa_secret_key)
    ret[:mfa_use] = !mfa_secret_key.nil?
    return ret
  end
end
