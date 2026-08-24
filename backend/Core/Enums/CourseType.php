<?php

namespace Core\Enums;

enum CourseType: string
{
    case THEORY = 'theory';
    case PRACTICAL = 'practical';
    case BOTH = 'both';
}
