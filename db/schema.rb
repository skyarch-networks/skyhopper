# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2019_10_01_021016) do

  create_table "app_settings", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "aws_region", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string "log_directory", null: false
    t.integer "ec2_private_key_id"
    t.boolean "dummy"
  end

  create_table "cf_templates", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "infrastructure_id"
    t.string "name"
    t.text "detail"
    t.text "value"
    t.integer "format", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text "params"
    t.integer "user_id"
    t.index ["infrastructure_id"], name: "manage_jsons_infrastructure_id_fk"
  end

  create_table "clients", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "code"
    t.string "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "cloud_watches", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "dish_servertests", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "dish_id", null: false
    t.integer "servertest_id", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "dishes", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "name"
    t.text "runlist"
    t.text "playbook_roles"
    t.text "extra_vars"
    t.integer "project_id"
    t.string "status"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text "detail"
  end

  create_table "ec2_private_keys", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "name"
    t.text "value"
  end

  create_table "infrastructure_logs", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "infrastructure_id"
    t.boolean "status"
    t.text "details", limit: 16777215
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer "user_id"
  end

  create_table "infrastructures", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string "region"
    t.string "status"
    t.string "stack_name"
    t.integer "project_id"
    t.integer "ec2_private_key_id"
    t.index ["project_id"], name: "infrastructures_project_id_fk"
    t.index ["stack_name", "region"], name: "index_infrastructures_on_stack_name_and_region_and_apikey", unique: true
  end

  create_table "master_monitorings", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "name"
    t.string "item"
    t.string "trigger_expression"
    t.boolean "is_common"
    t.index ["name"], name: "index_master_monitorings_on_name", unique: true
  end

  create_table "monitorings", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "infrastructure_id"
    t.integer "master_monitoring_id"
  end

  create_table "operation_durations", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "resource_id"
    t.datetime "start_date"
    t.datetime "end_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
  end

  create_table "project_parameters", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "project_id", null: false
    t.string "key", null: false
    t.string "value", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["project_id", "key"], name: "index_project_parameters_on_project_id_and_key", unique: true
    t.index ["project_id"], name: "index_project_parameters_on_project_id"
  end

  create_table "projects", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "code"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string "name"
    t.integer "client_id"
    t.string "access_key"
    t.string "secret_access_key"
    t.integer "zabbix_server_id"
    t.index ["client_id"], name: "projects_client_id_fk"
    t.index ["zabbix_server_id"], name: "index_projects_on_zabbix_server_id"
  end

  create_table "recurring_dates", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "operation_duration_id"
    t.integer "repeats"
    t.time "start_time"
    t.time "end_time"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "dates"
  end

  create_table "resource_servertests", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "resource_id", null: false
    t.integer "servertest_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "resource_statuses", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "resource_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "content", null: false
    t.integer "kind", null: false
  end

  create_table "resources", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "physical_id", null: false
    t.string "type_name", null: false
    t.integer "infrastructure_id", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string "screen_name"
    t.boolean "register_in_known_hosts"
    t.integer "dish_id"
    t.text "playbook_roles"
    t.text "extra_vars"
    t.index ["physical_id"], name: "index_resources_on_physical_id", unique: true
  end

  create_table "retention_policies", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "resource_id", null: false
    t.integer "max_amount"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["resource_id"], name: "index_retention_policies_on_resource_id", unique: true
  end

  create_table "schedules", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.boolean "enabled", default: false, null: false
    t.integer "frequency"
    t.integer "day_of_week"
    t.integer "time"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "physical_id"
    t.string "type", null: false
    t.string "volume_id"
  end

  create_table "servertest_result_details", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "servertest_id"
    t.integer "servertest_result_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "servertest_results", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "resource_id"
    t.boolean "auto_generated_servertest"
    t.integer "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "message"
  end

  create_table "servertests", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "infrastructure_id"
    t.string "name", null: false
    t.text "value", null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text "description"
    t.integer "category"
  end

  create_table "user_projects", id: false, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "project_id", null: false
    t.index ["project_id"], name: "user_projects_project_id_fk"
    t.index ["user_id", "project_id"], name: "index_user_projects_on_user_id_and_project_id", unique: true
  end

  create_table "user_zabbix_servers", id: false, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "zabbix_server_id", null: false
    t.index ["user_id"], name: "user_zabbix_servers_zabbix_server_id_fk"
    t.index ["zabbix_server_id", "user_id"], name: "index_user_zabbix_servers_on_user_id_and_zabbix_server_id", unique: true
  end

  create_table "users", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean "admin"
    t.boolean "master"
    t.string "mfa_secret_key"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "zabbix_servers", id: :integer, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci", force: :cascade do |t|
    t.string "fqdn"
    t.string "username"
    t.string "password"
    t.string "version"
    t.string "details"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

end
