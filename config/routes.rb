SkyHopper::Application.routes.draw do
  resources :zabbix_servers
  resources :users_admin, except: :show do
    collection do
      put 'sync_zabbix'
    end
  end

  devise_for :users, controllers: {
    sessions: 'users/sessions',
  }

  root to: 'root#root'

  resources :clients, except: :show

  resources :projects, except: :show
  resource :project_parameters, only: [:show, :update]

  resources :key_pairs, only: [:index, :destroy], param: :fingerprint do
    collection do
      get  'retrieve'
    end
  end

  resources :snapshots, only: [:index, :create, :destroy], param: :snapshot_id do
    collection do
      post 'schedule'
      post 'save_retention_policy'
    end
  end

  resources :infrastructures do
    member do
      post 'change_rds_scale'
      post 'rds_submit_groups'
      get  'show_rds'
      get  'show_elb'
      get  'show_s3'
      get  'stack_events'
      get  'get_schedule'
      post 'delete_stack'
      post 'save_schedule'
    end
  end

  resources :ec2_private_keys, only: [:create]

  resources :resources, only: [:index, :create]

  resources :nodes, only: [:update, :show, :edit] do
    collection do
      get  'recipes'
      post 'create_group'
    end
    member do
      put  'cook'
      put  'yum_update'
      get  'run_bootstrap'
      post 'apply_dish'
      post 'submit_groups'
      put  'update_attributes'
      get  'edit_attributes'
      get  'get_rules'
      get  'get_security_groups'
      post 'schedule_yum'
    end
  end

  resources :ec2_instances, only: [] do
    member do
      post 'change_scale'
      post 'start'
      post 'stop'
      post 'reboot'
      post 'detach'
      post 'terminate'
      get  'serverspec_status'
      post 'register_to_elb'
      post 'deregister_from_elb'
      post 'elb_submit_groups'
      get  'attachable_volumes'
      get  'available_resources'
      post 'attach_volume'
      post 'detach_volume'
    end
    collection do
      post 'create_volume'
    end
  end

  resources :elb, only: [] do
    collection do
      post 'create_listener'
      post 'delete_listener'
      post 'update_listener'
      post 'upload_server_certificate'
      post 'delete_server_certificate'
    end
  end

  resources :serverspecs do
    collection do
      get  'select'
      get  'results'
      post 'run'
      put  'create_for_rds'
      post 'schedule'
      get  'generator'
    end
  end

  resources :infrastructure_logs, only: :index

  resources :monitorings, only: [:create, :show, :edit, :update] do
    member do
      post 'create_host'
      post 'update_templates'
      get 'show_cloudwatch_graph'
      get 'show_problems'
      get 'show_url_status'
    end

    collection do
      get 'show_zabbix_graph'
    end
  end

  resources :cf_templates do
    collection do
      post 'throwjson'
      post 'add_ebs'
      post 'insert_cf_params'
      get  'history'
      get  'new_for_creating_stack'
      post 'create_and_send'
    end
  end

  resources :template_builder, only: [:create, :new] do
    collection do
      get 'resource_properties'
    end
  end

  resources :dishes do
    member do
      post 'validate'
      get  'runlist'
    end
  end

  resource :app_settings, only: [:create, :show] do
    collection do
      get :project
      get :system
      get :chef

      post :project_update

      get  :chef_new
      post :chef_create

      get  :edit_zabbix
      post :update_zabbix
      post :generate_key
    end
  end

  resources :server_status, param: :kind, only: [] do
    member do
      post :start
      post :stop
      post :status
    end
  end
end
