<?php

namespace Core\Localization;

/**
 * The configured machine-translation provider is missing credentials,
 * unreachable, or rejected the request. Controllers turn this into a
 * 503 so the client keeps the original text instead of failing.
 */
class TranslationProviderUnavailable extends \RuntimeException
{
}
