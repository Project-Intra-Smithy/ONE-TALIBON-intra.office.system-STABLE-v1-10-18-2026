<?php

declare(strict_types=1);

namespace App\Services\Planning;

use App\Models\PpaRecord;
use Brick\Math\BigDecimal;
use Illuminate\Validation\ValidationException;

final class PlanningAmounts
{
    public const FIELDS = ['appropriation_amount', 'ps_amount', 'mooe_amount', 'co_amount', 'climate_adaptation_amount', 'climate_mitigation_amount'];

    public function values(array $data, ?PpaRecord $existing = null): array
    {
        $values = [];
        foreach (self::FIELDS as $field) {
            $raw = array_key_exists($field, $data) ? $data[$field] : $existing?->{$field};
            if ($raw === null || $raw === '') {
                $values[$field] = null;

                continue;
            }
            if (! preg_match('/^\d{1,13}(?:\.\d{1,2})?$/D', (string) $raw)) {
                throw ValidationException::withMessages([$field => 'Enter a nonnegative amount with at most 13 integer digits and two decimal places.']);
            }
            $values[$field] = (string) BigDecimal::of((string) $raw)->toScale(2);
        }
        // An omitted initial total requires all components; updates preserve the recorded total.
        if (! array_key_exists('appropriation_amount', $data)
            && $existing === null
            && $values['ps_amount'] !== null
            && $values['mooe_amount'] !== null
            && $values['co_amount'] !== null) {
            $sum = BigDecimal::zero()->toScale(2);
            foreach (['ps_amount', 'mooe_amount', 'co_amount'] as $field) {
                $sum = $sum->plus($values[$field]);
            }
            if ($sum->isGreaterThan('9999999999999.99')) {
                throw ValidationException::withMessages(['appropriation_amount' => 'The component total exceeds the supported amount.']);
            }
            $values['appropriation_amount'] = (string) $sum;
        }

        return $values;
    }
}
