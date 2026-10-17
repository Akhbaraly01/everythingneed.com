<?php

namespace App\Console\Commands;

use Core\Support\PiiCipher;
use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Entities\Refund;

/**
 * Phase 2: encrypt PII written before the encrypted casts existed.
 *
 * Tables/columns: two_factor_secrets.secret, kyc_verifications
 * (document_number, full_name, date_of_birth, nationality, address),
 * payments (gateway_response, metadata), refunds (gateway_response).
 *
 * Idempotent: rows already encrypted under the CURRENT key are skipped.
 * Rotation: set APP_PREVIOUS_KEY to the retired key, deploy the new
 * APP_KEY, run this command — rows owned by the previous key are
 * re-encrypted to the current one with no plaintext window. Rows
 * decryptable by no known key are reported and fail the command.
 * Supports --dry-run (report only).
 */
class EncryptPiiBackfill extends Command
{
    protected $signature = 'security:encrypt-pii {--dry-run : Report only, write nothing}';

    protected $description = 'Encrypt legacy plaintext PII columns (idempotent)';

    private int $encrypted = 0;

    private int $rotated = 0;

    private int $skipped = 0;

    private int $errors = 0;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        // two_factor_secrets.secret — raw query: the model cast would throw
        // on legacy plaintext reads.
        foreach (DB::table('two_factor_secrets')->select(['id', 'secret'])->cursor() as $row) {
            $next = $this->toCurrentKey($row->secret);
            if (!$dryRun && $next !== null && $next !== $row->secret) {
                DB::table('two_factor_secrets')->where('id', $row->id)->update(['secret' => $next]);
            }
        }

        // kyc_verifications PII columns.
        $kycColumns = ['document_number', 'full_name', 'date_of_birth', 'nationality', 'address'];
        foreach (DB::table('kyc_verifications')->select(array_merge(['id'], $kycColumns))->cursor() as $row) {
            $patch = [];
            foreach ($kycColumns as $column) {
                $next = $this->toCurrentKey($row->{$column} ?? null);
                if (!$dryRun && $next !== null && $next !== ($row->{$column} ?? null)) {
                    $patch[$column] = $next;
                }
            }
            if ($patch !== []) {
                DB::table('kyc_verifications')->where('id', $row->id)->update($patch);
            }
        }

        // payments/refunds JSON payloads — decode legacy JSON text, then let
        // the encrypted:array casts re-encrypt through the models.
        foreach (['gateway_response', 'metadata'] as $column) {
            foreach (DB::table('payments')->select(['id', $column])->cursor() as $row) {
                $this->reencryptJson(Payment::class, (string) $row->id, $column, $row->{$column}, $dryRun);
            }
        }

        foreach (DB::table('refunds')->select(['id', 'gateway_response'])->cursor() as $row) {
            $this->reencryptJson(Refund::class, (string) $row->id, 'gateway_response', $row->gateway_response, $dryRun);
        }

        // AidRequest images are uploader URLs (not secrets) — intentionally
        // plaintext so galleries render without decryption cost.

        $this->info(sprintf(
            'security:encrypt-pii complete — encrypted=%d rotated=%d skipped=%d errors=%d%s',
            $this->encrypted,
            $this->rotated,
            $this->skipped,
            $this->errors,
            $dryRun ? ' (dry run)' : ''
        ));

        return $this->errors > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Classify a raw column value: null when nothing must change, otherwise
     * the ciphertext owned by the current key.
     */
    private function toCurrentKey(mixed $raw): ?string
    {
        if ($raw === null || $raw === '') {
            $this->skipped++;
            return is_string($raw) ? $raw : null;
        }

        if (!PiiCipher::isEncrypted($raw)) {
            $this->encrypted++;
            return PiiCipher::encrypt($raw);
        }

        try {
            Crypt::decryptString($raw);
            $this->skipped++;
            return $raw;
        } catch (DecryptException) {
            // Not owned by the current key: fall through to rotation.
        }

        try {
            $plain = PiiCipher::decrypt($raw);
            $this->rotated++;
            return PiiCipher::encrypt($plain);
        } catch (\Throwable) {
            $this->errors++;
            return $raw;
        }
    }

    private function reencryptJson(string $model, string $id, string $column, mixed $raw, bool $dryRun): void
    {
        if ($raw === null || $raw === '') {
            $this->skipped++;
            return;
        }

        if (PiiCipher::isEncrypted((string) $raw)) {
            $next = $this->toCurrentKey((string) $raw);
            if (!$dryRun && $next !== null && $next !== $raw) {
                DB::table((new $model)->getTable())->where('id', $id)->update([$column => $next]);
            }
            return;
        }

        $this->encrypted++;
        if ($dryRun) {
            return;
        }

        $decoded = json_decode((string) $raw, true);
        $record = $model::find($id);
        if ($record) {
            $record->{$column} = is_array($decoded) ? $decoded : ['value' => $raw];
            $record->save();
        }
    }
}
