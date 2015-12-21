namespace :release do
  desc 'Generate release note template'
  task :note_gen do
    fetch = 'git fetch'
    puts fetch
    # system(fetch)

    # get PRs
    log = `git log origin/master..origin/develop --oneline --merges`.split("\n")
    re = %r!^[a-f0-9]{7} Merge pull request (?<num>#\d+) from [\-a-zA-Z0-9_]+/(?<name>.+)$!
    log.each do |line|
      ma = re.match(line)
      next unless ma

      num = ma[:num]
      name = ma[:name]

      puts "- #{name} #{num}"
    end

    puts

    puts 'Features'
    puts '--------'
    puts
    puts 'Bug fix'
    puts '--------'
    puts
    puts 'Version up'
    puts '--------'
    puts
    puts 'Others'
    puts '--------'
    puts


    puts 'Update process'
    puts '--------'
    puts
    puts '```sh'
    puts 'cd YOUR_SKYHOPPER_DIRECTORY'
    puts "export RAILS_ENV=production  # This command isn't needed if you use develop environment."
    puts 'git pull'
    puts 'git checkout <VERSION>'

    diff_files = `git diff --name-only origin/master..origin/develop`.split("\n")

    if diff_files.include?('Gemfile') || diff_files.include?('Gemfile.lock')
      puts 'bundle install'
    end

    if diff_files.find{|x| %r!^db/migrate/.+\.rb$!.match(x)}
      puts 'bundle exec rake db:migrate'
    end

    if diff_files.include?('bower.json')
      puts 'bower install'
    end

    npm_i = diff_files.include?('frontend/package.json')
    gulp_ts = !!diff_files.find{|x| %r!^frontend/.+\.ts!.match(x)}
    gulp_tsd = !!diff_files.include?('frontend/tsd.json')

    if npm_i || gulp_ts || gulp_tsd
      puts 'cd frontend/'
      puts 'npm install' if npm_i
      puts 'gulp ts' if gulp_ts
      puts 'gulp tsd' if gulp_tsd
      puts 'cd ..'
    end

    puts '```'
  end
end
