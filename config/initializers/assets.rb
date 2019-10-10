# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path.
# Rails.application.config.assets.paths << Emoji.images_path
# Add Yarn node_modules folder to the asset load path.
Rails.application.config.assets.paths << Rails.root.join('node_modules')

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in the app/assets
# folder are already added.
# Rails.application.config.assets.precompile += %w( admin.js admin.css )

SkyHopper::Application.configure do
  # for controllers js
  config.assets.precompile += Dir.glob(Rails.root.join('app', 'controllers', '*.rb')).map { |x| File.basename(x)[/^(.+)_controller\.rb/, 1] + '.js' }
  config.assets.precompile += %w[edit_playbook.js libraries.js]
  config.assets.precompile += ['modules/vfs_fonts.js']
  config.assets.initialize_on_precompile = true
end
