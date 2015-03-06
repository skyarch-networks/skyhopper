# encoding: UTF-8
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

ActiveRecord::Schema.define(version: 20150219060005) do

  create_table "app_settings", force: :cascade do |t|
    t.string   "chef_url",           limit: 255,   null: false
    t.string   "chef_name",          limit: 255,   null: false
    t.text     "chef_key",           limit: 65535, null: false
    t.string   "aws_region",         limit: 255,   null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "log_directory",      limit: 255,   null: false
    t.integer  "ec2_private_key_id", limit: 4
    t.string   "zabbix_fqdn",        limit: 255
    t.string   "zabbix_user",        limit: 255
    t.string   "zabbix_pass",        limit: 255
  end

  add_index "app_settings", ["ec2_private_key_id"], name: "app_settings_ec2_private_key_id_fk", using: :btree

  create_table "cf_templates", force: :cascade do |t|
    t.integer  "infrastructure_id", limit: 4
    t.string   "name",              limit: 255
    t.text     "detail",            limit: 65535
    t.text     "value",             limit: 65535
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "params",            limit: 65535
    t.integer  "user_id",           limit: 4
  end

  add_index "cf_templates", ["infrastructure_id"], name: "manage_jsons_infrastructure_id_fk", using: :btree

  create_table "clients", force: :cascade do |t|
    t.string   "code",       limit: 255
    t.string   "name",       limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "cloud_providers", force: :cascade do |t|
    t.string "name", limit: 255
  end

  add_index "cloud_providers", ["name"], name: "index_cloud_providers_on_name", unique: true, using: :btree

  create_table "cloud_watches", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "dish_serverspecs", force: :cascade do |t|
    t.integer  "dish_id",       limit: 4, null: false
    t.integer  "serverspec_id", limit: 4, null: false
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "dishes", force: :cascade do |t|
    t.string   "name",       limit: 255
    t.text     "runlist",    limit: 65535
    t.integer  "project_id", limit: 4
    t.string   "status",     limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "detail",     limit: 65535
  end

  create_table "ec2_private_keys", force: :cascade do |t|
    t.string "name",  limit: 255
    t.text   "value", limit: 65535
  end

  create_table "infrastructure_logs", force: :cascade do |t|
    t.integer  "infrastructure_id", limit: 4
    t.boolean  "status",            limit: 1
    t.text     "details",           limit: 16777215
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "user_id",           limit: 4
  end

  create_table "infrastructures", force: :cascade do |t|
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "region",             limit: 255
    t.string   "status",             limit: 255
    t.string   "stack_name",         limit: 255
    t.integer  "project_id",         limit: 4
    t.integer  "ec2_private_key_id", limit: 4
  end

  add_index "infrastructures", ["ec2_private_key_id"], name: "infrastructures_ec2_private_key_id_fk", using: :btree
  add_index "infrastructures", ["project_id"], name: "infrastructures_project_id_fk", using: :btree
  add_index "infrastructures", ["stack_name", "region"], name: "index_infrastructures_on_stack_name_and_region_and_apikey", unique: true, using: :btree

  create_table "master_monitorings", force: :cascade do |t|
    t.string  "name",               limit: 255
    t.string  "item",               limit: 255
    t.string  "trigger_expression", limit: 255
    t.boolean "is_common",          limit: 1
  end

  add_index "master_monitorings", ["name"], name: "index_master_monitorings_on_name", unique: true, using: :btree

  create_table "monitorings", force: :cascade do |t|
    t.integer "infrastructure_id",    limit: 4
    t.integer "master_monitoring_id", limit: 4
  end

  create_table "projects", force: :cascade do |t|
    t.string   "code",              limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "name",              limit: 255
    t.integer  "client_id",         limit: 4
    t.string   "access_key",        limit: 255
    t.string   "secret_access_key", limit: 255
    t.integer  "cloud_provider_id", limit: 4,   null: false
  end

  add_index "projects", ["client_id"], name: "projects_client_id_fk", using: :btree

  create_table "resources", force: :cascade do |t|
    t.string   "physical_id",       limit: 255, null: false
    t.string   "type_name",         limit: 255, null: false
    t.integer  "infrastructure_id", limit: 4,   null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "screen_name",       limit: 255
  end

  add_index "resources", ["physical_id"], name: "index_resources_on_physical_id", unique: true, using: :btree

  create_table "serverspecs", force: :cascade do |t|
    t.integer  "infrastructure_id", limit: 4
    t.string   "name",              limit: 255,   null: false
    t.text     "value",             limit: 65535, null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "description",       limit: 65535
  end

  create_table "user_projects", id: false, force: :cascade do |t|
    t.integer "user_id",    limit: 4, null: false
    t.integer "project_id", limit: 4, null: false
  end

  add_index "user_projects", ["project_id"], name: "user_projects_project_id_fk", using: :btree
  add_index "user_projects", ["user_id", "project_id"], name: "index_user_projects_on_user_id_and_project_id", unique: true, using: :btree

  create_table "users", force: :cascade do |t|
    t.string   "email",                  limit: 255, default: "", null: false
    t.string   "encrypted_password",     limit: 255, default: "", null: false
    t.string   "reset_password_token",   limit: 255
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          limit: 4,   default: 0,  null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip",     limit: 255
    t.string   "last_sign_in_ip",        limit: 255
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "admin",                  limit: 1
    t.boolean  "master",                 limit: 1
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true, using: :btree
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true, using: :btree

  add_foreign_key "app_settings", "ec2_private_keys", name: "app_settings_ec2_private_key_id_fk", on_delete: :cascade
  add_foreign_key "cf_templates", "infrastructures", name: "manage_jsons_infrastructure_id_fk", on_delete: :cascade
  add_foreign_key "infrastructures", "ec2_private_keys", name: "infrastructures_ec2_private_key_id_fk", on_delete: :cascade
  add_foreign_key "infrastructures", "projects", name: "infrastructures_project_id_fk", on_delete: :cascade
  add_foreign_key "projects", "clients", name: "projects_client_id_fk", on_delete: :cascade
  add_foreign_key "user_projects", "projects", name: "user_projects_project_id_fk", on_delete: :cascade
  add_foreign_key "user_projects", "users", name: "user_projects_user_id_fk", on_delete: :cascade
end
