<?php

namespace Core\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

abstract class BaseSeeder extends Seeder
{
    abstract protected function model(): string;

    abstract protected function data(): array;

    public function run(): void
    {
        $model = $this->model();

        if (method_exists($model, 'truncate')) {
            $model::truncate();
        }

        $records = $this->data();

        foreach (array_chunk($records, 100) as $chunk) {
            $model::insert($chunk);
        }
    }

    protected function timestamp(): string
    {
        return now()->toDateTimeString();
    }
}
