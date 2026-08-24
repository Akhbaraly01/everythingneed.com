<?php

namespace Core\Actions;

abstract class BaseAction
{
    abstract public function execute(array $data): mixed;

    protected function validate(array $data, array $rules): array
    {
        return validator($data, $rules)->validate();
    }
}
