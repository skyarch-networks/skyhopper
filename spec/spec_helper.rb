#
# Copyright (c) 2013-2015 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

# This file is copied to spec/ when you run 'rails generate rspec:install'
ENV["RAILS_ENV"] ||= 'test'
require File.expand_path("../../config/environment", __FILE__)
require 'rspec/rails'
require 'simplecov'
require 'simplecov-rcov'
SimpleCov.formatter = SimpleCov::Formatter::RcovFormatter
SimpleCov.start do
  add_filter '/vendor/bundle/'
  add_filter '/spec/'
  add_filter '/db/'
end

# Requires supporting ruby files with custom matchers and macros, etc,
# in spec/support/ and its subdirectories.
Dir[Rails.root.join("spec/support/**/*.rb")].each { |f| require f }

# Checks for pending migrations before tests are run.
# If you are not using ActiveRecord, you can remove this line.
ActiveRecord::Migration.check_pending! if defined?(ActiveRecord::Migration)

RSpec.configure do |config|
  # ## Mock Framework
  #
  # If you prefer to use mocha, flexmock or RR, uncomment the appropriate line:
  #
  # config.mock_with :mocha
  # config.mock_with :flexmock
  # config.mock_with :rr

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = true

  # If true, the base class of anonymous controllers will be inferred
  # automatically. This will be the default behavior in future versions of
  # rspec-rails.
  config.infer_base_class_for_anonymous_controllers = false

  # Run specs in random order to surface order dependencies. If you find an
  # order dependency and want to debug it, you can fix the order by providing
  # the seed, which is printed after each run.
  #     --seed 1234
  #config.order = "random"

  config.include Capybara::DSL, :type => :feature

  config.include FactoryGirl::Syntax::Methods
  config.include Devise::TestHelpers, :type => :controller
  config.include Devise::TestHelpers, :type => :view
  config.extend ControllerMacros, :type => :controller
  config.extend ControllerMacros, :type => :view
  config.extend StackStub
  config.extend InfraStub
  config.extend ZabbixStub
  config.extend RDSStub
  config.extend S3Stub

  config.before(:suite) do
    DatabaseCleaner.clean_with(:truncation)
    DatabaseCleaner.strategy = :truncation

    FactoryGirl.create(:cloud_provider, name: 'AWS') unless CloudProvider.find_by(name: 'AWS')
    FactoryGirl.create(:app_setting)
  end

  config.before(:each) do
    DatabaseCleaner.start
  end

  config.after(:each) do
    DatabaseCleaner.clean
  end

  # disables should
  config.expect_with :rspec do |c|
    c.syntax = :expect
  end

  config.infer_spec_type_from_file_location!

  config.before do
    #XXX view の時だけ実行したい
    allow(view).to receive(:paginate) rescue nil
  end

  config.before do
    allow(Redis).to receive(:new).and_return(double('redis', publish: true))
  end
end

AWS.stub!
Aws.config[:stub_responses] = true
ChefAPI.class_variable_set(:@@ridley, Ridley.new(server_url: 'https://dummy.dummy',  client_name: 'dummy',  client_key: <<EOS))
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEA1Nn9urdkVWQB/mW5M/ttlLGEnhhKT666ZhIrZlPPycS7Bynq
kyzb7tVVL9JGqO1fp4ylUGR6DPOhBRJkT5I9x1BrULdxLcLh0Of/SZQj8msGYZEM
CivR+Ms4BGPDGnsgMhwc3YTOtzbIKo5M0oMvwGx3KjFs1RxXypmqlCVYkePS9uqc
MRWgYE7oBirX1MnzRtqWCc49sMtmfad5qqZEg5gMRSEWaiEjE23j3prtsHIXY2VC
/wM53RWptcZzfDOT/RdVqgYS/+R0CMJiC+9tnoGJpON83FNBAiuhofDfBz40Newt
Ek1WXZF1JyroROtbhaNDnWWSD6Gut9PLXdT5bwIDAQABAoIBAA0+m0k5DCc8F9uq
nMGdTY5JFYV44Xbf2n1reAPgBzf44+JoO055Jh5QbAKTxQ3R53fXipncBrQznLti
D5fb87gpSuQ05fgA/mgvZ3U+oJX/DuCXU/Z2D5S5oHy1cHh/XNuBYFJwZySDZiUv
wZv/ycLhfPDFLo58OwJCWZjqUf6R34tpVZ4dhfSrftmgAcOy24T5pvPlHVSLnGsJ
zq4aba0EHsfgHvZamd4wTBxQkrOP/nWzliRzNSX5OZCVveNQpFZ84xMD7k4zFl9/
U/97+CwAXlMEe6DwtxTSHv2ZDw8QnFYBci1KZmL0NKPMPjfUBjylAWW6w3t+TnqA
WpcFyaECgYEA67Xc4JFcrDdoGQAwB1ivaKNs3wGStj/F/xu+0kMYEkfNCIw+Q1XU
F8e+Cde0PN3zCSmlvY1HBnxHagD8+N/tfke2FMDuwS3IFE+xEgpqQuHQxUeffNF+
r0ZvynEEjD3sZqdoGFO6mKtGbrAES/szEkKiI0gFUwVIBPvqMkplM7cCgYEA5yxo
cTTOayuyvB7JAjjE1ru2SdSgZVARRVEyPrMxjYtn12cYYe1oRmGFxeZ3QzUCwgjn
1Ur7AHSekXPLdUVb07kRzon8Pjn68PMXXuVF6RNJiwaVkXepgPBDswzC2Z8Hg5Fq
1WuMG2YLxc5aloITzy72s++rQAdZqi9+Tun7GAkCgYEA3dApyGbix+noG0bS68bo
YtcP+Bh54OnIwJZyj1m2SFWrO/UGDsWxLqO4UXjc0z6mnCPGJcfSY+cGKVo+tVG9
I84GKieZRs93bq3D209TyhbJKS2Kh6J5ziXBw8dxWSxY0A2P5vy8JzlesYEQuhPt
bqyn+f2njQX2TUJnlOXvsKcCgYEAkw9KBbI9Gio7UrcW0kYA2kWhqggMXUb5JaqI
lyBxhoTHc10PQsS/T/6cFhANkIB5l6wIp0RCtsB5WzhZlumfh+m0rTpUb9V8kKlk
FacuuR3e7AUtQtPnzbGKr62PitdC9WydlNUM1SUumhAyyopHRcavhDoUK/BBFyWN
aXApntkCgYEAzB+R2DvRy963kKvYzvkq99syzn0DBE8h4ro3fFwqy5zw/31SqgI7
H67rIX6aZKTWNY9f0xyTk5d2NuQocAoAkttWkXvlDa4G30y2x8Ib/j+jt9wESnWh
zr9mdG3ikQbl91RB2eGTICPGCeVUcmxRS1GN9NH+fwwfjnbKCkpGA34=
-----END RSA PRIVATE KEY-----
EOS
