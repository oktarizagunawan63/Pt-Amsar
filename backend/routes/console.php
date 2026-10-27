<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

// Daily jobs. They only run while the server calls `php artisan schedule:run` every minute
// (cron on Linux, Task Scheduler on Windows) — see README.
Schedule::command('projects:refresh-status')->dailyAt('00:05')->withoutOverlapping();
Schedule::command('visits:mark-missed')->dailyAt('00:15')->withoutOverlapping();
Schedule::command('projects:check-deadlines')->dailyAt('08:00')->withoutOverlapping();
Schedule::command('projects:check-budget')->dailyAt('09:00')->withoutOverlapping();
