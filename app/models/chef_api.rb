#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

::I_KNOW_THAT_OPENSSL_VERIFY_PEER_EQUALS_VERIFY_NONE_IS_WRONG = nil

module ChefAPI
  class Error < StandardError;
    class NotFound < self; end
    class CookbookNotFound < NotFound; end
  end


  module_function

  # TODO: Rails server をリスタートする必要がある
  def setup
    @@ridley = ::Ridley.from_chef_config(File.expand_path("~/.chef/knife.rb"))
  rescue => ex
    Rails.logger.warn(ex)
  end
  setup

  # == Arguments
  # [kind]
  # Resource の種類。 cookbook, node, client など
  # [name]
  # Resource を識別するための記号。cookbookの名前など

  def client(kind)
    return @@ridley.__send__(kind)
  end

  def index(kind)
    return client(kind).all
  end

  def destroy(kind, name)
    client(kind).delete(name)
  end

  # 指定した cookbook の最新バージョンにおけるレシピの一覧を返す。
  # ==== Args
  # [cookbook_name] String cookbook の名前
  # ==== Exceptions
  # [CookbookNotFound] Cookbook が存在しない場合に投げる。
  def recipes(cookbook_name)
    cookbook = @@ridley.cookbook.find(cookbook_name, '_latest')
    raise Error::CookbookNotFound, "#{cookbook_name} doesn't exists." unless cookbook

    recipes = cookbook.recipes
    return recipes.map{|x| File.basename(x.name, ".rb")}
  end

  # ==== Exceptions
  # [NotFound] 指定したリソースが存在しない場合に投げる。
  def find(kind, name)
    res = client(kind).find(name)
    raise Error::NotFound, "#{kind}:#{name} doesn't exists." unless res

    return res
  end

  # ==== return
  # Spice#details like Hash.
  def details(kind, name)
    return find(kind, name).to_hash
  end

  def search_node(name)
    @@ridley.search(:node, "name:#{name}")
  end
end
