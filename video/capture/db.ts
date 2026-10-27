import { execFileSync } from 'node:child_process';

const MYSQL = 'C:/laragon/bin/mysql/mysql-8.4.3-winx64/bin/mysql.exe';
const PHP = 'C:/laragon/bin/php/php-8.3.26-Win32-vs16-x64/php.exe';

/** Runs SQL against amsar_dashboard (sent on stdin, so `$` in hashes needs no escaping). Returns tab-separated rows. */
export function query(sql: string): string {
  return execFileSync(MYSQL, ['-N', '-B', '-uroot', 'amsar_dashboard'], { input: sql, encoding: 'utf8' });
}

/** Bcrypt hash at Laravel's default cost; the plain password travels on stdin, never on a command line. */
export function bcrypt(plain: string): string {
  return execFileSync(PHP, ['-r', 'echo password_hash(stream_get_contents(STDIN), PASSWORD_BCRYPT, ["cost" => 12]);'], {
    input: plain,
    encoding: 'utf8',
  });
}
