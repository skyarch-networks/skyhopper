require 'active_record'

namespace :db do
  namespace :data do
    error_msg = 'Please specify the path. (e.g. rails db:data:load[./db/hoge.sql]'

    desc 'Dump the database to tmp/dbname.sql (path is optional)'
    task :dump, [:path] => %i[environment load_config] do |_, args|
      set_config

      path =
        args[:path] || "tmp/#{@config['database']}.sql"

      cmd = "mysqldump -u#{@config['username']} -p#{@config['password']} #{@config['database']} --compatible=ansi > '#{path}'"
      system(cmd)
    end

    desc 'Load a .sql file into the database'
    task :load, [:path] => %i[environment load_config] do |_, args|
      abort error_msg if args.to_h.empty?

      set_config
      cmd = "mysql -u#{@config['username']} -p#{@config['password']} #{@config['database']} < '#{args[:path]}'"
      system(cmd)
    end

    def set_config
      env = Rails.env
      @config = ActiveRecord::Base.configurations[env]
    end
  end
end
