/** Seconds in common time units — use for Redis TTL */
export const TTL = {
  ONE_HOUR:    60 * 60,
  ONE_DAY:     24 * 60 * 60,
  SEVEN_DAYS:  7  * 24 * 60 * 60,
  NINETY_DAYS: 90 * 24 * 60 * 60,
} as const;

/** Milliseconds — use for Date arithmetic */
export const MS = {
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
} as const;
