namespace :release do
  desc 'Generate release note template'
  task :note_gen do
    fetch = 'git fetch'
    STDERR.puts fetch
    system(fetch)

    # get PRs
    log = `git log origin/master..origin/develop --oneline --merges`.split("\n")
    re = %r!^[a-f0-9]{8} Merge pull request (?<num>#\d+) from [\-a-zA-Z0-9_]+/(?<name>.+)$!
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

    diff_files = `git diff --name-only origin/master..origin/develop`.split("\n")

    if diff_files.include?('Gemfile') || diff_files.include?('Gemfile.lock')
      puts 'bundle install'
    end

    if diff_files.find { |x| %r{^db/migrate/.+\.rb$}.match(x) }
      puts 'bundle exec rails db:migrate RAILS_ENV=production'
    end

    yarn = diff_files.include?('frontend/package.json')

    if yarn
      puts 'cd frontend/'
      puts 'yarn' if yarn
      puts 'cd ..'
    end

    puts '```'
  end
end
