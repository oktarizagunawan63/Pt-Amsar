<?php

namespace App\Console\Commands;

use App\Helpers\NotificationHelper;
use App\Models\Project;
use Illuminate\Console\Command;

class CheckProjectBudget extends Command
{
    protected $signature = 'projects:check-budget';

    protected $description = 'Notifikasi proyek yang realisasi anggarannya melebihi RAB';

    public function handle(): int
    {
        $projects = Project::where('status', '!=', 'completed')
            ->whereColumn('rab_realisasi', '>', 'rab')
            ->get();

        foreach ($projects as $project) {
            NotificationHelper::projectOverBudget($project);
        }

        $this->info("{$projects->count()} proyek over budget.");
        return self::SUCCESS;
    }
}
