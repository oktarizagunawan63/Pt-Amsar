<?php

namespace App\Console\Commands;

use App\Helpers\NotificationHelper;
use App\Models\Project;
use Illuminate\Console\Command;

class CheckProjectDeadlines extends Command
{
    protected $signature = 'projects:check-deadlines';

    protected $description = 'Notifikasi proyek yang deadline-nya 7 hari lagi atau kurang dengan progress di bawah 80%';

    public function handle(): int
    {
        $projects = Project::where('status', '!=', 'completed')
            ->whereDate('end_date', '>=', now()->toDateString())
            ->whereDate('end_date', '<=', now()->addDays(7)->toDateString())
            ->where('progress', '<', 80)
            ->get();

        foreach ($projects as $project) {
            NotificationHelper::deadlineApproaching($project);
        }

        $this->info("{$projects->count()} proyek mendekati deadline.");
        return self::SUCCESS;
    }
}
