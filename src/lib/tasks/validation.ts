export function tasksOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function isTaskScheduled(task: {
  startTime: Date | null;
  endTime: Date | null;
}): boolean {
  return task.startTime !== null && task.endTime !== null;
}

export function validateTaskTimes(
  startTime: Date | null,
  endTime: Date | null,
): string | null {
  if (startTime === null && endTime === null) {
    return null;
  }

  if (startTime === null || endTime === null) {
    return "Please provide both a start and end time, or leave scheduling blank.";
  }

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

export function parseOptionalSchedule(input: {
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  sameDay?: boolean;
}): { startTime: Date | null; endTime: Date | null; error: string | null } {
  const hasAnyScheduleField = Boolean(
    input.startDate ||
      input.startTime ||
      input.endDate ||
      input.endTime,
  );

  if (!hasAnyScheduleField) {
    return { startTime: null, endTime: null, error: null };
  }

  if (!input.startDate || !input.startTime || !input.endTime) {
    return {
      startTime: null,
      endTime: null,
      error: "Please complete all schedule fields or clear them to submit without a date.",
    };
  }

  const endDate =
    input.sameDay || !input.endDate ? input.startDate : input.endDate;

  try {
    const startTime = combineDateAndTime(input.startDate, input.startTime);
    const endTime = combineDateAndTime(endDate, input.endTime);
    const timeError = validateTaskTimes(startTime, endTime);
    if (timeError) {
      return { startTime: null, endTime: null, error: timeError };
    }
    return { startTime, endTime, error: null };
  } catch {
    return { startTime: null, endTime: null, error: "Invalid date or time." };
  }
}
