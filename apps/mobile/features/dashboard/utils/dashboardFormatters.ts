export function formatDateLabel(isoDate: string | null): string {
  if (!isoDate) return 'Not used yet';

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function formatDateTimeLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function formatVolumeKg(totalVolumeKg: number): string {
  return `${Math.round(totalVolumeKg).toLocaleString('en-US')} kg`;
}

export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0m';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);

  if (hours <= 0) return `${minutes}m`;
  return `${hours} hr ${String(minutes).padStart(2, '0')}m`;
}

export function getGreetingTitle(firstName: string, now = new Date()): string {
  const hour = now.getHours();

  if (hour < 12) return `Good morning, ${firstName}!`;
  if (hour < 18) return `Good afternoon, ${firstName}!`;
  return `Good evening, ${firstName}!`;
}

export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.trim()?.[0] ?? '';
  const last = lastName?.trim()?.[0] ?? '';
  return `${first}${last}`.toUpperCase() || 'U';
}
