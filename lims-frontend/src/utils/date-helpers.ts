import { format, parseISO, isValid, differenceInDays, isSameDay } from 'date-fns';

/**
 * Format a date to a display string
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = 'MMM d, yyyy'): string {
    if (!date) return '';
    try {
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(parsedDate)) return '';
        return format(parsedDate, formatStr);
    } catch {
        return '';
    }
}

/**
 * Format a date range for display
 * Examples:
 * - "Dec 10 - Dec 14, 2024" (both dates, same year)
 * - "Dec 10, 2024 - Jan 5, 2025" (different years)
 * - "Dec 10, 2024 - Ongoing" (endDate null)
 * - "Dec 10, 2024" (same date)
 */
export function formatDateRange(
    startDate: string | Date | null | undefined,
    endDate: string | Date | null | undefined
): string {
    if (!startDate) return '';

    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    if (!isValid(start)) return '';

    // No end date
    if (!endDate) {
        return `${format(start, 'MMM d, yyyy')} - Ongoing`;
    }

    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    if (!isValid(end)) {
        return `${format(start, 'MMM d, yyyy')} - Ongoing`;
    }

    // Same day
    if (isSameDay(start, end)) {
        return format(start, 'MMM d, yyyy');
    }

    // Same year
    if (start.getFullYear() === end.getFullYear()) {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }

    // Different years
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
}

/**
 * Get date range display object
 */
export function getDateRangeDisplay(
    startDate: string | Date | null | undefined,
    endDate: string | Date | null | undefined
): {
    formatted: string;
    isOngoing: boolean;
    duration: number | null;
    startFormatted: string;
    endFormatted: string | null;
} {
    const formatted = formatDateRange(startDate, endDate);
    const isOngoing = !endDate;

    let duration: number | null = null;
    if (startDate && endDate) {
        const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
        const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
        if (isValid(start) && isValid(end)) {
            duration = differenceInDays(end, start) + 1; // Include both start and end days
        }
    }

    const startFormatted = formatDate(startDate);
    const endFormatted = endDate ? formatDate(endDate) : null;

    return {
        formatted,
        isOngoing,
        duration,
        startFormatted,
        endFormatted,
    };
}

/**
 * Validate date range (end date must be >= start date)
 */
export function isDateRangeValid(
    startDate: string | Date | null | undefined,
    endDate: string | Date | null | undefined
): boolean {
    // No start date is invalid
    if (!startDate) return false;

    // No end date is valid (ongoing)
    if (!endDate) return true;

    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

    if (!isValid(start) || !isValid(end)) return false;

    return end >= start;
}

/**
 * Format date for API submission (ISO string)
 */
export function formatDateForApi(date: Date | string | null | undefined): string | null {
    if (!date) return null;
    const parsed = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsed)) return null;
    return parsed.toISOString();
}

/**
 * Get relative time description
 */
export function getRelativeTimeDescription(
    startDate: string | Date | null | undefined,
    endDate: string | Date | null | undefined
): string {
    if (!startDate) return '';

    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    if (!isValid(start)) return '';

    const now = new Date();
    const daysUntilStart = differenceInDays(start, now);

    // Not started yet
    if (daysUntilStart > 0) {
        return `Starts in ${daysUntilStart} day${daysUntilStart > 1 ? 's' : ''}`;
    }

    // Check if ongoing
    if (!endDate) {
        return 'In progress';
    }

    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    if (!isValid(end)) return 'In progress';

    const daysUntilEnd = differenceInDays(end, now);

    // Already ended
    if (daysUntilEnd < 0) {
        return `Ended ${Math.abs(daysUntilEnd)} day${Math.abs(daysUntilEnd) > 1 ? 's' : ''} ago`;
    }

    // Currently active
    if (daysUntilEnd === 0) {
        return 'Ends today';
    }

    return `${daysUntilEnd} day${daysUntilEnd > 1 ? 's' : ''} remaining`;
}
