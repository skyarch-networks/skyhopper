SkyHopper::Application.configure do
  # for controllers js
  config.assets.precompile += Dir.glob(Rails.root.join('app', 'controllers', '*.rb')).map { |x| File.basename(x)[/^(.+)_controller\.rb/, 1] + '.js' }
  config.assets.precompile += %w[edit_runlist.js libraries.js]
  config.assets.precompile += ['modules/vfs_fonts.js']
  config.assets.initialize_on_precompile = true
end
