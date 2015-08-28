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

class MigrateFromSchema < ActiveRecord::Migration

  create_table "clients", force: true do |t|
    t.string   "code"
    t.string   "name"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

  create_table "dishes", force: true do |t|
    t.string   "name"
    t.text     "runlist"
    t.text     "serverspecs"
    t.integer  "project_id"
    t.string   "status"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "detail"
  end

  create_table "infrastructure_logs", force: true do |t|
    t.integer  "infrastructure_id"
    t.boolean  "status"
    t.text "details",           limit: 16777215
    t.datetime "created_at"
    t.datetime "updated_at"
    t.integer  "user_id"
  end

  create_table "infrastructures", force: true do |t|
    t.integer  "kind"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "keypairname"
    t.string   "region"
    t.string   "status"
    t.string   "stack_name"
    t.integer  "project_id"
  end

  add_index "infrastructures", ["project_id"], name: "infrastructures_project_id_fk", using: :btree
  add_index "infrastructures", ["stack_name", "region"], name: "index_infrastructures_on_stack_name_and_region_and_apikey", unique: true, using: :btree

  create_table "manage_jsons", force: true do |t|
    t.integer  "infrastructure_id"
    t.string   "subj"
    t.text     "detail"
    t.text     "json"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "params"
    t.integer  "user_id"
  end

  add_index "manage_jsons", ["infrastructure_id"], name: "manage_jsons_infrastructure_id_fk", using: :btree

  create_table "mst_infra_kinds", force: true do |t|
    t.integer "kind"
    t.string  "kindname"
  end

  create_table "mst_serv_icons", force: true do |t|
    t.string "kind"
    t.string "filename"
  end

  create_table "projects", force: true do |t|
    t.string   "code"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.string   "name"
    t.integer  "client_id"
    t.string   "apikey"
    t.string   "apikey_secret"
  end

  add_index "projects", ["client_id"], name: "projects_client_id_fk", using: :btree

  create_table "serverspecs", force: true do |t|
    t.integer  "infrastructure_id"
    t.string   "name",              null: false
    t.text     "value",             null: false
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "description"
  end

  create_table "templates", force: true do |t|
    t.string   "name"
    t.text     "detail"
    t.text     "json"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.text     "diagram"
    t.text     "chefattribs"
    t.text     "cookbooks"
  end

  create_table "user_projects", id: false, force: true do |t|
    t.integer "user_id",    null: false
    t.integer "project_id", null: false
  end

  add_index "user_projects", ["project_id"], name: "user_projects_project_id_fk", using: :btree
  add_index "user_projects", ["user_id", "project_id"], name: "index_user_projects_on_user_id_and_project_id", unique: true, using: :btree

  create_table "users", force: true do |t|
    t.string   "email",                  default: "", null: false
    t.string   "encrypted_password",     default: "", null: false
    t.string   "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer  "sign_in_count",          default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string   "current_sign_in_ip"
    t.string   "last_sign_in_ip"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "admin"
    t.boolean  "master"
  end

  add_index "users", ["email"], name: "index_users_on_email", unique: true, using: :btree
  add_index "users", ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true, using: :btree

  add_foreign_key "infrastructures", "projects", on_delete: :cascade

  add_foreign_key "manage_jsons", "infrastructures", on_delete: :cascade

  add_foreign_key "projects", "clients", on_delete: :cascade

  add_foreign_key "user_projects", "projects", on_delete: :cascade
  add_foreign_key "user_projects", "users", on_delete: :cascade

end
