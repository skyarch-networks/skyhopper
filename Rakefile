# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

require File.expand_path('../config/application', __FILE__)

SkyHopper::Application.load_tasks

task :register_users, ["users", "output"] => :environment do |_x, args|
  output = File.open(args.output, "w")

  client = Client.find_or_create_by(name: "Skyarch Networks Trial", code: "Skyarch Networks Trial")

  File.readlines(args.users).each do |row|
    row_arr = row.chomp.split(",")

    require 'securerandom'
    u = User.new(email: row_arr[0])
    u.password = SecureRandom.hex(4)
    u.admin = true if row_arr.index("admin")
    u.master = true if row_arr.index("master")

    begin
      u.save!
    rescue => ex
      res = "[create ng] email:#{row.chomp} #{ex.message}"
    else
      unless row_arr.index("no_project")
        unless u.create_project(client)
          res = "[create ng] email:#{u.email} password:#{u.password} failed to create project."
        end
      end
      res = "[create ok] email:#{u.email} password:#{u.password}"
    end
    output.puts(res)
    puts(res)
  end

  output.close
end
