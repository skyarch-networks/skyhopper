# app/jobs/test_job.rb
class TestJob < ActiveJob::Base
  def perform
    # put you scheduled code here
    # Comments.deleted.clean_up...

    puts 'test job!'
  end
end
