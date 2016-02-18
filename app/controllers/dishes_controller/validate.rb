#
# Copyright (c) 2013-2016 SKYARCH NETWORKS INC.
#
# This software is released under the MIT License.
#
# http://opensource.org/licenses/mit-license.php
#

module DishesController::Validate
  # POST /dishes/1/validate
  def validate
    id = params.require(:id)

    # dishのテスト
    Thread.new_with_db do
      dish  = Dish.find(id)

      begin
        @ws = WSConnector.new('dish_validate', dish.id)

        validate_section(:creating, dish) do
          prj             = Project.for_test
          @infrastructure = Infrastructure.create_for_test(prj.id, dish.name)
          create_test_stack(@infrastructure, dish)
        end



        validate_section(:bootstrapping, dish) do
          bootstrap_test_instance(@infrastructure)
        end



        # update runlist and cook
        validate_section(:applying, dish) do
          begin
            apply_dish_for_test(@infrastructure, dish)
          rescue Node::CookError
            update_validate_status(dish, :failure)
            Thread.current.exit
          end
        end



        # serverspec

        # TODO: auto_generated なものを使用する?
        #       使用したいけど、invalidなserverspecが生成される場合があるので難しそう
        validate_section(:serverspec, dish) do
          validate = serverspec_for_test(dish, @infrastructure)

          unless validate
            update_validate_status(dish, :failure)
            Thread.current.exit
          end
        end



        update_validate_status(dish, :success)



      rescue => ex
        # なんらかの理由でValidateできなかった場合
        # status に nil を設定してThreadを抜ける
        Rails.logger.error(ex.message)

        dish.update_status(nil)
        @ws.push("NOT YET")
      ensure
        # 後始末
        # TODO: error handling
        Rails.logger.debug('start destroy test stack')

        @infrastructure.detach_chef rescue true
        @stack.delete               rescue true
        @infrastructure.destroy     rescue true

        Rails.logger.debug('complete destroy test stack')
      end
    end

    # test 用 render
    render text: 'Validate dish is successfully started.'
  end


  private

  def validate_section(status, dish, &_block)
    Rails.logger.debug("start #{status} dish test instance")
    update_validate_status(dish, status)

    yield

    Rails.logger.debug("complete #{status} dish test instance")
  end

  def update_validate_status(dish, status)
    dish.update_status(status)
    @ws.push(dish.status)
  end

  # microのEC2インスタンスを含むStackを建てる
  # また、以下のインスタンス変数をセットする
  #   - @stack
  # TODO: model に移す?
  # TODO: DRY
  #       CfTemplatesController#create のコピペ
  def create_test_stack(infrastructure, dish)
    cf_template = CfTemplate.new(
      infrastructure_id: infrastructure.id,
      name:              "t2.micro for Dish validate",
      detail:            "Dish: #{dish.name}",
      value:             ERB::Builder.new('dish_test').build,
      user_id:           current_user.id
    )

    @stack = Stack.new(infrastructure)
    parameters = cf_template.create_cfparams_set(infrastructure)

    begin
      @stack.apply_template(cf_template.value, parameters)
      # rubocop:disable Lint/HandleExceptions
    rescue
      # rubocop:enable Lint/HandleExceptions
      # Stack Create failed
      #render text: ex.message, status: 500
    else
      infrastructure.status = @stack.status[:status]
      infrastructure.save!

      cf_template.params = parameters.to_json
      cf_template.save
    end


    # Stackのcreate_completeを確認
    @stack.wait_status('CREATE_COMPLETE')
  end

  # テスト用のインスタンスに対して、Bootstrapする。
  # 20秒おきに9回試し、それ以降はタイムアウト。
  # また、以下のインスタンス変数をセットする
  #   - @node
  #   - @physical_id
  def bootstrap_test_instance(infrastructure)
    @physical_id = @stack.instances.first.physical_resource_id
    fqdn         = infrastructure.instance(@physical_id).public_dns_name
    retry_count  = 9     # 20 * 9 = 180 sec
    begin
      @node = Node.bootstrap(fqdn, @physical_id, infrastructure)
    rescue
      retry_count -= 1
      if retry_count < 0
        raise 'Bootstrap Timeout'
      end

      sleep 20
      Rails.logger.info("Retry bootstrap...")
      retry
    end
  end


  # テスト用のインスタンスに対して、RunlistをUpdateした後にCookする。
  # cookに失敗した場合は Node::CookError が投げられる。
  def apply_dish_for_test(infrastructure, dish)
    # Update runlist
    runlist = dish.runlist
    @node.update_runlist(runlist)

    # Cook
    @node.wait_search_index
    @node.cook(infrastructure) do |line|
      Rails.logger.debug("cooking #{@physical_id} > #{line}")
    end
  end

  # テスト用のインスタンスに対して、Serverspecを実行する。
  # Serverspecに失敗した場合は、 Node::ServerspecError が投げられる
  # serverspecの成功をBoolで返す
  def serverspec_for_test(dish, infrastructure)
    svrspecs    = dish.serverspecs
    return true if svrspecs.empty?
    @infrastructure.resources_or_create
    svrspec_res = @node.run_serverspec(infrastructure.id, svrspecs.map(&:id), false)

    return svrspec_res[:summary][:failure_count] == 0
  end
end
