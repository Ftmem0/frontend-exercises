export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(iso));
