<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $table = 'settings';
    protected $fillable = ['setting_key', 'setting_value'];
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    public static function get(string $key, $default = null)
    {
        $setting = self::where('setting_key', $key)->first();
        return $setting ? $setting->setting_value : $default;
    }

    public static function set(string $key, $value): bool
    {
        return self::updateOrCreate(
            ['setting_key' => $key],
            ['setting_value' => $value]
        ) ? true : false;
    }
}
