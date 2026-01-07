import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import AppLayout from '@/layouts/app-layout';
import schedule from '@/routes/schedule/index';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Repeat } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My Schedule',
        href: schedule.mySchedule().url,
    },
];

interface Schedule {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    break_duration: number;
    shift_type: string;
    location: string | null;
    notes: string | null;
    status: string;
    is_recurring: boolean;
    recurrence_pattern: string | null;
}

interface MyScheduleProps {
    schedules: Schedule[];
}

export default function MySchedule({ schedules }: MyScheduleProps) {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    // Get all dates that have schedules (normalize to midnight for proper comparison)
    const scheduledDates = schedules.map((schedule) => {
        const date = new Date(schedule.date);
        date.setHours(0, 0, 0, 0);
        return date;
    });

    // Get schedules for the selected date
    const selectedDateSchedules = selectedDate
        ? schedules.filter(
              (schedule) =>
                  schedule.date ===
                  selectedDate.toISOString().split('T')[0],
          )
        : [];

    const formatTime = (time: string): string => {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'published':
                return 'default';
            case 'draft':
                return 'secondary';
            case 'cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Schedule" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            <CardTitle>My Schedule</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-6 lg:flex-row">
                            <div className="flex flex-col items-center">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    modifiers={{
                                        scheduled: scheduledDates,
                                    }}
                                    modifiersClassNames={{
                                        scheduled: 'bg-primary/20 text-primary font-semibold',
                                    }}
                                    className="rounded-md border"
                                />
                                <p className="mt-4 text-sm text-muted-foreground">
                                    Days highlighted in blue indicate scheduled shifts
                                </p>
                            </div>

                            <div className="flex-1">
                                {selectedDate ? (
                                    <div>
                                        <h3 className="mb-4 text-lg font-semibold">
                                            {formatDate(
                                                selectedDate.toISOString().split('T')[0],
                                            )}
                                        </h3>
                                        {selectedDateSchedules.length > 0 ? (
                                            <div className="space-y-3">
                                                {selectedDateSchedules.map((schedule) => (
                                                    <Card key={schedule.id}>
                                                        <CardContent className="pt-6">
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-lg font-medium">
                                                                        {formatTime(
                                                                            schedule.start_time,
                                                                        )}{' '}
                                                                        -{' '}
                                                                        {formatTime(
                                                                            schedule.end_time,
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Badge variant="outline">
                                                                            {
                                                                                schedule.shift_type
                                                                            }
                                                                        </Badge>
                                                                        <Badge
                                                                            variant={getStatusBadgeVariant(
                                                                                schedule.status,
                                                                            )}
                                                                        >
                                                                            {schedule.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>

                                                                {schedule.location && (
                                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                                        <MapPin className="h-4 w-4" />
                                                                        {schedule.location}
                                                                    </div>
                                                                )}

                                                                {schedule.break_duration > 0 && (
                                                                    <div className="text-sm text-muted-foreground">
                                                                        Break:{' '}
                                                                        {
                                                                            schedule.break_duration
                                                                        }{' '}
                                                                        minutes
                                                                    </div>
                                                                )}

                                                                {schedule.notes && (
                                                                    <div className="rounded-md bg-muted p-3 text-sm">
                                                                        {schedule.notes}
                                                                    </div>
                                                                )}

                                                                {schedule.is_recurring && (
                                                                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                                        <Repeat className="h-4 w-4" />
                                                                        Recurring:{' '}
                                                                        {
                                                                            schedule.recurrence_pattern
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                                No shifts scheduled for this day
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                        Select a date to view your shifts
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

