SkyHopper::Application.routes.draw do
  resources :users_admin, except: :show do
    collection do
      put 'sync_zabbix'
    end
  end

  devise_for :users

  root to: 'root#root'

  resources :clients, except: :show

  resources :projects, except: :show

  resources :infrastructures do
    collection do
      get  'cloudformation_status'
      get  'events'
    end
    member do
      post 'change_rds_scale'
      get  'show_rds'
      get  'show_elb'
      get  'show_s3'
      get  'stack_events'
      post 'delete_stack'
    end
  end

  resources :ec2_private_keys, only: [:create]

  resources :resources, only: [:index, :create]

  resources :nodes, only: [:update, :show, :edit] do
    collection do
      get  'recipes'
    end
    member do
      put  'cook'
      put  'yum_update'
      get  'run_bootstrap'
      post 'apply_dish'
      put  'update_attributes'
      get  'edit_attributes'
    end
  end

  resources :ec2_instances, only: [] do
    member do
      post 'change_scale'
      post 'start'
      post 'stop'
      post 'reboot'
      get  'serverspec_status'
      post 'register_to_elb'
      post 'deregister_from_elb'
    end
  end

  resources :serverspecs do
    collection do
      get  'select'
      post 'run'
      put  'create_for_rds'
    end
  end

  resources :infrastructure_logs, only: :index

  resources :monitorings, only: [:show, :edit, :update] do
    member do
      post 'create_host'
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
