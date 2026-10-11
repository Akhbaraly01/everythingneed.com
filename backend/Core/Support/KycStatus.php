<?php

namespace Core\Support;

use InvalidArgumentException;

/**
 * Spec 28 KYC verification states.
 *
 * Stored vocabulary (stable; pinned by tests, admin queue and dashboards):
 *   pending, submitted, approved, rejected, requires_action
 *
 * Canonical spec vocabulary (derived, exposed as verification_state):
 *   not_started, pending, under_review, verified, rejected, requires_action
 */
final class KycStatus
{
    public const NOT_STARTED = 'not_started';
    public const PENDING = 'pending';
    public const UNDER_REVIEW = 'under_review';
    public const VERIFIED = 'verified';
    public const REJECTED = 'rejected';
    public const REQUIRES_ACTION = 'requires_action';

    public const REVIEWABLE = ['pending', 'submitted', 'requires_action'];
    public const IN_REVIEW = ['pending', 'submitted'];

    public static function canonical(?string $stored): string
    {
        return match ($stored) {
            null => self::NOT_STARTED,
            'pending' => self::PENDING,
            'submitted' => self::UNDER_REVIEW,
            'approved', 'verified' => self::VERIFIED,
            'rejected' => self::REJECTED,
            'requires_action' => self::REQUIRES_ACTION,
            default => throw new InvalidArgumentException("Unknown KYC status [{$stored}]"),
        };
    }

    public static function isVerified(?string $stored): bool
    {
        return in_array($stored, ['approved', 'verified'], true);
    }

    public static function isReviewable(?string $stored): bool
    {
        return in_array($stored, self::REVIEWABLE, true);
    }

    public static function isInReview(?string $stored): bool
    {
        return in_array($stored, self::IN_REVIEW, true);
    }
}
