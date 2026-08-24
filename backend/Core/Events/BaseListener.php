<?php

namespace Core\Events;

abstract class BaseListener
{
    abstract public function handle(object $event): void;
}
