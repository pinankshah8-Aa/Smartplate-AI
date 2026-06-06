export function getISTDate() {
  const now = new Date();
  const utcOffset = now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 60 * 60000; // IST is UTC+5:30
  return new Date(now.getTime() + utcOffset + istOffset);
}

export function getISTDateString() {
  const istDate = getISTDate();
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isLocked(cutoffTime: string) { // cutoffTime format: "08:30"
  if (!cutoffTime) return false;
  const [cutoffHours, cutoffMinutes] = cutoffTime.split(':').map(Number);
  const istDate = getISTDate();
  
  const currentHours = istDate.getHours();
  const currentMinutes = istDate.getMinutes();

  if (currentHours > cutoffHours) return true;
  if (currentHours === cutoffHours && currentMinutes >= cutoffMinutes) return true;
  
  return false;
}

export function formatTimeToAMPM(time24: string) {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${ampm}`;
}
