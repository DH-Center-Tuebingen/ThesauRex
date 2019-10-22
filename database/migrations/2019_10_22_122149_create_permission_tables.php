<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreatePermissionTables extends Migration
{

    private function isPartOfSpacialist() {
        if(!Schema::hasTable('migrations')) {
            return false;
        }
        return \DB::table('migrations')
            ->where('migration', '2018_09_06_092028_setup_tables')
            ->exists()
            &&
            \DB::table('migrations')
            ->where('migration', '2019_10_15_100721_create_permission_tables')
            ->exists();
    }
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Nothing todo if spacialist is already updated
        if($this->isPartOfSpacialist()) return;

        $old_roles = \DB::table('roles')->get();
        $old_perms = \DB::table('permissions')->get();
        $old_role_perms = \DB::table('permission_role')->get();
        $old_user_roles = \DB::table('role_user')->get();

        $role_map = [];
        $perm_map = [];

        Schema::drop('permission_role');
        Schema::drop('role_user');
        Schema::drop('roles');
        Schema::drop('permissions');

        $tableNames = config('permission.table_names');
        $columnNames = config('permission.column_names');

        Schema::create($tableNames['permissions'], function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('display_name')->nullable();
            $table->string('description')->nullable();
            $table->string('guard_name');
            $table->timestamps();
        });

        Schema::create($tableNames['roles'], function (Blueprint $table) {
            $table->increments('id');
            $table->string('name');
            $table->string('display_name')->nullable();
            $table->string('description')->nullable();
            $table->string('guard_name');
            $table->timestamps();
        });

        Schema::create($tableNames['model_has_permissions'], function (Blueprint $table) use ($tableNames, $columnNames) {
            $table->unsignedInteger('permission_id');

            $table->string('model_type');
            $table->unsignedBigInteger($columnNames['model_morph_key']);
            $table->index([$columnNames['model_morph_key'], 'model_type', ], 'model_has_permissions_model_id_model_type_index');

            $table->foreign('permission_id')
                ->references('id')
                ->on($tableNames['permissions'])
                ->onDelete('cascade');

            $table->primary(['permission_id', $columnNames['model_morph_key'], 'model_type'],
                    'model_has_permissions_permission_model_type_primary');
        });

        Schema::create($tableNames['model_has_roles'], function (Blueprint $table) use ($tableNames, $columnNames) {
            $table->unsignedInteger('role_id');

            $table->string('model_type');
            $table->unsignedBigInteger($columnNames['model_morph_key']);
            $table->index([$columnNames['model_morph_key'], 'model_type', ], 'model_has_roles_model_id_model_type_index');

            $table->foreign('role_id')
                ->references('id')
                ->on($tableNames['roles'])
                ->onDelete('cascade');

            $table->primary(['role_id', $columnNames['model_morph_key'], 'model_type'],
                    'model_has_roles_role_model_type_primary');
        });

        Schema::create($tableNames['role_has_permissions'], function (Blueprint $table) use ($tableNames) {
            $table->unsignedInteger('permission_id');
            $table->unsignedInteger('role_id');

            $table->foreign('permission_id')
                ->references('id')
                ->on($tableNames['permissions'])
                ->onDelete('cascade');

            $table->foreign('role_id')
                ->references('id')
                ->on($tableNames['roles'])
                ->onDelete('cascade');

            $table->primary(['permission_id', 'role_id'], 'role_has_permissions_permission_id_role_id_primary');
        });

        foreach($old_roles as $r) {
            $role_map["old_$r->id"] = $this->createRoleForAllGuards($r);
        }

        foreach($old_perms as $p) {
            $perm_map["old_$p->id"] = $this->createPermissionForAllGuards($p);
        }

        foreach($old_role_perms as $rp) {
            // pid, rid
            $role = $role_map["old_$rp->role_id"];
            $perm = $perm_map["old_$rp->permission_id"];
            $role->givePermissionTo($perm);
        }

        foreach($old_user_roles as $ur) {
            // uid, rid
            $user = User::find($ur->user_id);
            $role = $role_map["old_$ur->role_id"];
            $user->assignRole($role->name);
        }

        app('cache')
            ->store(config('permission.cache.store') != 'default' ? config('permission.cache.store') : null)
            ->forget(config('permission.cache.key'));
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        $tableNames = config('permission.table_names');

        Schema::drop($tableNames['role_has_permissions']);
        Schema::drop($tableNames['model_has_roles']);
        Schema::drop($tableNames['model_has_permissions']);
        Schema::drop($tableNames['roles']);
        Schema::drop($tableNames['permissions']);
    }

    private function createRoleForAllGuards($role) {
        // id, name, display_name, description, created_at, updated_at
        $new_role = Role::create([
            'guard_name' => 'web',
            'name' => $role->name
        ]);
        $new_role->display_name = $role->display_name;
        $new_role->description = $role->description;
        $new_role->created_at = $role->created_at;
        $new_role->save();
        return $new_role;
    }

    private function createPermissionForAllGuards($perm) {
        // id, name, display_name, description, created_at, updated_at
        $new_perm = Permission::create([
            'guard_name' => 'web',
            'name' => $perm->name
        ]);
        $new_perm->display_name = $perm->display_name;
        $new_perm->description = $perm->description;
        $new_perm->created_at = $perm->created_at;
        $new_perm->save();
        return $new_perm;
    }
}
