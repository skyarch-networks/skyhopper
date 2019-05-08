SkyHopper::Application.routes.draw do
  if Rails.env.development?
    require 'sidekiq/web'
    require 'sidekiq/cron/web'
    mount Sidekiq::Web => '/sidekiq'
  end

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
  resource :project_parameters, only: %i[show update]

  resources :key_pairs, only: %i[index destroy], param: :fingerprint do
    collection do
      get  'retrieve'
    end
  end

  resources :snapshots, only: %i[index create destroy], param: :snapshot_id do
    collection do
      post 'schedule'
      post 'save_retention_policy'
    end
  end

  get 'infrastructures/infra/*path', to: 'infrastructures#index'
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
      post 'start_rds'
      post 'stop_rds'
      post 'reboot_rds'
      get 'edit_keypair'
      patch 'update_keypair'
    end
  end

  resources :ec2_private_keys, only: [:create]

  resources :resources, only: %i[index create]

  resources :nodes, only: [:show] do
    collection do
      post 'create_group'
    end
    member do
      put  'yum_update'
      post 'apply_dish'
      post 'submit_groups'
      get  'get_rules'
      get  'get_security_groups'
      post 'schedule_yum'
      put  'run_ansible_playbook'
      get  'edit_ansible_playbook'
      put  'update_ansible_playbook'
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

  resources :servertests do
    collection do
      get  'select'
      get  'results'
      post 'run_serverspec'
      put  'create_for_rds'
      post 'schedule'
      get  'generator'
      get  'awspec_generator'
      get  'generate_awspec'
    end
  end

  resources :infrastructure_logs, only: :index do
    member do
      get 'download'
    end

    collection do
      get 'download_all'
    end
  end

  resources :monitorings, only: %i[create show edit update] do
    member do
      post 'create_host'
      post 'update_templates'
      post 'change_zabbix_server'
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

  resources :template_builder, only: %i[create new] do
    collection do
      get 'resource_properties'
    end
  end

  resources :dishes do
    member do
      post 'validate'
    end
  end

  resource :app_settings, only: %i[create show] do
    collection do
      post :system_server_create

      get  :edit_zabbix
      post :update_zabbix
    end
  end

  resources :server_status, param: :kind, only: [] do
    member do
      post :start
      post :stop
      post :status
    end
  end

  resource :database, only: [:show] do
    collection do
      post :export
      post :import
    end
  end
end
