<?php

namespace App\Services;

use App\Models\PlanVisit;
use App\Models\ProjectNotification;
use App\Models\RealisasiVisit;
use App\Models\User;
use App\Models\Warning;
use Illuminate\Support\Facades\Schema;

/**
 * Records a plan visit as "terlewat": a missed realisasi, a high-priority warning for the
 * salesperson, and notifications to them and to the sales managers / administrators.
 * Shared by the "Terlewat" button and the daily visits:mark-missed job so both behave the same.
 */
class MissedVisitRecorder
{
    /** @param int|null $visitedBy who marked it; null when the daily job does. */
    public function record(PlanVisit $planVisit, ?int $visitedBy): RealisasiVisit
    {
        $realisasiVisit = RealisasiVisit::create([
            'plan_visit_id' => $planVisit->id,
            'type'          => 'planned',
            'status'        => 'missed',
            'visit_time'    => null,
            'notes'         => 'Visit marked as missed',
            'visited_by'    => $visitedBy,
        ]);

        $customerName = $planVisit->customer->name ?? 'Customer';
        $visitDate    = $planVisit->tanggal_visit;

        $warningData = [
            'title' => 'Visit Terlewat',
            'message' => "Visit ke {$customerName} pada {$visitDate} ditandai terlewat.",
            'is_read' => false,
        ];
        if (Schema::hasColumn('warnings', 'priority')) {
            $warningData['priority'] = 'high';
        }
        if (Schema::hasColumn('warnings', 'status')) {
            $warningData['status'] = 'unread';
        }

        Warning::updateOrCreate(
            [
                'type' => 'missed_visit',
                'plan_visit_id' => $planVisit->id,
                'user_id' => $planVisit->assigned_to ?: ($visitedBy ?: $planVisit->created_by),
            ],
            $warningData
        );

        if ($planVisit->assigned_to) {
            $this->notify($planVisit->assigned_to,
                "Kunjungan ke {$customerName} pada {$visitDate} telah ditandai sebagai TERLEWAT.");
        }
        $salesName = User::find($planVisit->assigned_to)?->name ?? '-';
        foreach (User::whereIn('role', ['sales_manager', 'administrator'])->get() as $manager) {
            $this->notify($manager->id,
                "Kunjungan ke {$customerName} ({$visitDate}) oleh {$salesName} telah ditandai TERLEWAT.");
        }

        return $realisasiVisit;
    }

    private function notify(int $userId, string $message): void
    {
        ProjectNotification::create([
            'user_id'    => $userId,
            'project_id' => null,
            'type'       => 'deadline_warning',
            'title'      => 'Kunjungan Terlewat',
            'message'    => $message,
            'is_read'    => false,
        ]);
    }
}
