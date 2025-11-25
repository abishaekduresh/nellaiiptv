<?php

namespace App\Helpers;

use Valitron\Validator as V;

class Validator
{
    public static function validate(array $data, array $rules): array
    {
        $v = new V($data);
        $v->rules($rules);

        if (!$v->validate()) {
            return $v->errors();
        }

        return [];
    }
}
