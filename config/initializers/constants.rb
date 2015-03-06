# TODO: DRY
# TagName以外は同じだから共通化したい

module CookStatus
  TagName    = 'CookStatus'.freeze
  Success    = 'Success'.freeze
  Failed     = 'Failed'.freeze
  InProgress = 'InProgress'.freeze
  UnExecuted = 'UnExecuted'.freeze
end

module ServerspecStatus
  TagName    = 'ServerspecStatus'.freeze
  Success    = 'Success'.freeze
  Failed     = 'Failed'.freeze
  Pending    = 'Pending'.freeze
  UnExecuted = 'UnExecuted'.freeze
end

module UpdateStatus
  TagName    = 'UpdateStatus'.freeze
  Success    = 'Success'.freeze
  Failed     = 'Failed'.freeze
  InProgress = 'InProgress'.freeze
  UnExecuted = 'UnExecuted'.freeze
end
