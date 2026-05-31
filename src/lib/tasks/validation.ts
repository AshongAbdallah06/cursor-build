export function tasksOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function validateTaskTimes(startTime: Date, endTime: Date): string | null {
  const now = new Date();

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return "Invalid date or time.";
  }

  if (endTime <= startTime) {
    return endTime.toDateString() === startTime.toDateString()
      ? "End time must be after start time."
      : "Deadline must be after the start date and time.";
  }

  if (startTime < now) {
    return "Cannot schedule a task in the past.";
  }

  return null;
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00`);
}
