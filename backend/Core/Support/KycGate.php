<?php

namespace Core\Support;

use Core\Exceptions\ForbiddenException;
use Illuminate\Support\Facades\DB;

/**
 * Spec 28: KYC is required before protected financial wallet functionality
 * (withdrawals, transfers, wallet payments). Enforcement lives at the API /
 * action boundary — the ledger services themselves stay pure so existing
 * service-level contracts hold.
 */
final class KycGate
{
    public static function isVerified(string $userId): bool
    {
        $status = DB::table('kyc_verifications')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->value('status');

        return KycStatus::isVerified($status);
    }

    /**
     * @throws ForbiddenException
     */
    public static function requireVerified(string $userId, string $action = 'This action'): void
    {
        if (!self::isVerified($userId)) {
            throw new ForbiddenException($action.' requires a verified identity (KYC).');
        }
    }

    /** Spec 28 canonical state for a user, without leaking any documents. */
    public static function verificationState(string $userId): string
    {
        $status = DB::table('kyc_verifications')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->value('status');

        return KycStatus::canonical($status);
    }
}
