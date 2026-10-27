<?php

namespace App\Console\Commands;

use App\Models\PlanVisit;
use App\Services\MissedVisitRecorder;
use Illuminate\Console\Command;

/**
 * Approved visits whose day has ended without a realisasi are recorded as terlewat, exactly as
 * if the salesperson had pressed the button. Pending (unapproved) visits are left to the manager.
 */
class MarkMissedVisits extends Command
{
    protected $signature = 'visits:mark-missed';

    protected $description = 'Tandai terlewat visit yang sudah disetujui, lewat harinya, dan belum direalisasi';

    public function handle(MissedVisitRecorder $recorder): int
    {
        $visits = PlanVisit::with('customer')
            ->where('status', 'approved')
            ->whereDate('tanggal_visit', '<', now()->toDateString())
            ->doesntHave('realisasiVisit')
            ->get();

        foreach ($visits as $visit) {
            $recorder->record($visit, null);
        }

        $this->info("{$visits->count()} visit ditandai terlewat.");
        return self::SUCCESS;
    }
}
