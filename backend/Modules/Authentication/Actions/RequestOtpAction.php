<?php
namespace Modules\Authentication\Actions;

use Core\Actions\BaseAction;

class RequestOtpAction extends BaseAction
{
    public function execute(array $data): array
    {
        $validated = $this->validate($data, ['identifier' => 'required|string']);
        return ['message' => 'OTP sent successfully'];
    }
}