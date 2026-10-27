<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Command;

/** Status is only computed when a project is written to; this keeps idle projects honest. */
class RefreshProjectStatus extends Command
{
    protected $signature = 'projects:refresh-status';

    protected $description = 'Hitung ulang status proyek yang belum selesai (on track / at risk / delayed)';

    public function handle(): int
    {
        $changed = 0;
        Project::where('status', '!=', 'completed')->each(function (Project $project) use (&$changed) {
            $status = Project::statusFor($project->end_date, (int) $project->progress);
            if ($status !== $project->status) {
                $project->update(['status' => $status]);
                $changed++;
            }
        });

        $this->info("{$changed} proyek berubah status.");
        return self::SUCCESS;
    }
}
