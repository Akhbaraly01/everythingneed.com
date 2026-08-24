<?php

namespace Modules\Healthcare\Actions;

use Modules\Healthcare\Entities\Doctor;
use Core\Exceptions\ValidationException;

class CreateDoctor
{
    public function execute(array $data): object
    {
        return Doctor::create($data);
    }
}
