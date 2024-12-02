import { TimePicker } from "@/components/ui/datetime-picker";
import { CustomInputProps } from "./common";

export function TimeInput({ commonProps, changeValue }: CustomInputProps) {
  const value = commonProps.value
    ? parsePostgreSQLTime(commonProps.value)
    : undefined;

  const onChange = (newTime?: Date) => {
    if (newTime) {
      changeValue(formatToPostgreSQLTime(newTime));
    }
  };

  return (
    <div className="w-72 mx-2">
      <TimePicker hourCycle={12} date={value} onChange={onChange} />
    </div>
  );
}

/**
 * Parse a PostgreSQL TIME string into a Date object
 * Supports formats like:
 * - '14:30:25'           (HH:MM:SS)
 * - '14:30:25.123'       (HH:MM:SS.mmm)
 * - '14:30:25-08:00'     (HH:MM:SS with timezone offset)
 * - '14:30:25.123-08:00' (HH:MM:SS.mmm with timezone offset)
 *
 * @param timeString - PostgreSQL TIME formatted string
 * @returns Date object representing the time
 * @throws Error if the input string is not a valid PostgreSQL TIME format
 */
export function parsePostgreSQLTime(timeString: string): Date {
  // Remove timezone offset if present
  const timeWithoutTimezone = timeString.replace(/[+-]\d{2}:\d{2}$/, "");

  // Validate basic time format
  const timeRegex = /^(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/;
  const match = timeWithoutTimezone.match(timeRegex);

  if (!match) {
    throw new Error(`Invalid PostgreSQL TIME format: ${timeString}`);
  }

  // Extract hours, minutes, seconds, and optional milliseconds
  const [, hours, minutes, seconds, milliseconds] = match;

  // Create a date with the parsed time (using today's date)
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));

  // Add milliseconds if present
  if (milliseconds) {
    // Trim to 3 decimal places and convert to milliseconds
    const ms = parseFloat(milliseconds.substring(0, 4)) * 1000;
    date.setMilliseconds(ms);
  }

  return date;
}

/**
 * Convert a Date object to a PostgreSQL TIME string
 *
 * @param date - Date object to convert
 * @param includeMilliseconds - Whether to include milliseconds (default: true)
 * @returns PostgreSQL TIME formatted string
 */
export function formatToPostgreSQLTime(
  date: Date,
  includeMilliseconds: boolean = true
): string {
  // Pad single-digit numbers with leading zero
  const pad = (num: number) => num.toString().padStart(2, "0");

  // Extract time components
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  // Format base time string
  let timeString = `${hours}:${minutes}:${seconds}`;

  // Optionally add milliseconds
  if (includeMilliseconds) {
    // Get milliseconds and pad to 3 digits
    const ms = date.getMilliseconds().toString().padStart(3, "0");
    timeString += `.${ms}`;
  }

  return timeString;
}
