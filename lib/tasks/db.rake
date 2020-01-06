require 'active_record'

namespace :db do
  namespace :data do
    error_msg = 'Please specify the path. (e.g. rails db:data:load[./db/hoge.sql]'

    desc 'Dump the database to tmp/dbname.sql (path and mode is optional)'
    task :dump, %i[path mode] => %i[environment load_config] do |_, args|
      set_config_and_cmd_host_part

      path =
        args[:path] || "tmp/#{@config['database']}.sql"

      cmd_compatible_part = if args[:mode].blank? || args[:mode] == 'legacy'
                              # このオプションが追加される前は、この指定になっていました
                              # なので、互換性維持のため、デフォルトはこのモードにしています
                              '--compatible=ansi'
                            elsif args[:mode] == 'modern'
                              ''
                            else
                              abort 'Option "mode" is allow to value legacy or modern.'
                            end

      cmd = "mysqldump #{@cmd_host_part} -u#{@config['username']} -p#{@config['password']} #{@config['database']} #{cmd_compatible_part} > '#{path}'"
      system(cmd)
    end

    desc 'Load a .sql file into the database'
    task :load, [:path] => %i[environment load_config] do |_, args|
      abort error_msg if args.to_h.empty?

      set_config_and_cmd_host_part
      cmd = "mysql #{@cmd_host_part} -u#{@config['username']} -p#{@config['password']} #{@config['database']} < '#{args[:path]}'"
      system(cmd)
    end

    def set_config_and_cmd_host_part
      env = Rails.env
      @config = ActiveRecord::Base.configurations[env]

      @cmd_host_part = if @config['host']
                         "-h #{@config['host']}"
                       else
                         ''
                       end
    end
  end
end
