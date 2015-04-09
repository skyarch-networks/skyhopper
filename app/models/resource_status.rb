class ResourceStatus < ActiveRecord::Base
  belongs_to :resource

  Success    = 'Success'.freeze
  Failed     = 'Failed'.freeze
  Pending    = 'Pending'.freeze
  UnExecuted = 'UnExecuted'.freeze
  InProgress = 'InProgress'.freeze

  KindServerspec = 'serverspec'.freeze
  KindCook       = 'cook'.freeze
  KindYum        = 'yum'.freeze

  scope :serverspec, -> () { self.find_by(kind: KindServerspec) }
  scope :cook,       -> () { self.find_by(kind: KindCook) }
  scope :yum,        -> () { self.find_by(kind: KindYum) }

  %w[success failed pending un_executed in_progress].each do |name|
    define_method("#{name}?") do
      self.value == self.class.const_get(name.camelize)
    end
  end
end
