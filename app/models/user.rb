#
# Copyright (c) 2013-2017 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

require 'digest/sha2'

class User < ApplicationRecord
  has_many :cf_templates,         dependent: :nullify
  has_many :infrastructure_logs,  dependent: :nullify

  has_many :user_projects
  has_many :operation_durations
  has_many :projects, through: :user_projects

  has_many :user_zabbix_servers
  has_many :zabbix_servers, through: :user_zabbix_servers

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
    where(admin: true, master: true).empty?
  end

  def master?
    master
  end

  def admin?
    admin
  end

  def allow?(project_or_infra)
    return true if master?

    case project_or_infra
    when Project
      project_ids.include?(project_or_infra.id)
    when Infrastructure
      allow?(project_or_infra.project)
    end
  end

  def create_project(client)
    prj = Project.new(
      client: client,
      name: email,
      code: email,
      access_key: DUMMY_TEXT,
      secret_access_key: DUMMY_TEXT,
    )
    if prj.save
      UserProject.create(user_id: id, project_id: prj.id)
    end
    prj
  end

  # WebSocket のエンドポイントに使用する文字列を返す
  # @return [String]
  def ws_key
    Digest::SHA256.hexdigest(email + encrypted_password + current_sign_in_at.to_s)
  end

  # @return [Hash{Symbol => Any}] Attributes trimed password
  def trim_password
    ret = attributes.symbolize_keys
    ret.delete(:encrypted_password)
    ret.delete(:mfa_secret_key)
    ret[:mfa_use] = !mfa_secret_key.nil?
    ret
  end

  # 新しい MFA の鍵を作成して返す。
  # XXX: 少し遅め(開発環境で100ms程度)
  # @return [String] mfa の秘密鍵
  # @return [String] QR code を HTML で表した文字列
  def new_mfa_key
    mfa_key = ROTP::Base32.random_base32
    uri = ROTP::TOTP.new(mfa_key, issuer: 'SkyHopper').provisioning_uri("skyhopper/#{email}")
    mfa_qrcode = RQRCode::QRCode.new(uri).as_html # XXX: ここが遅い

    [mfa_key, mfa_qrcode]
  end
end
