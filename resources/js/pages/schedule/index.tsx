import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AppLayout from '@/layouts/app-layout';
import { store, update, destroy } from '@/actions/App/Http/Controllers/ScheduleController';
import schedule from '@/routes/schedule/index';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Form, Head, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { ArrowUpDown, CalendarIcon, ListIcon, MapPin, PencilIcon, PlusIcon, Repeat, TrashIcon, User } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Schedule',
        href: schedule.index().url,
    },
];

interface User {
    id: number;
    name: string;
    email: string;
}

interface Schedule {
    id: number;
    user_id: number | null;
    user: User | null;
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
    created_at: string;
}

interface ScheduleIndexProps {
    schedules: Schedule[];
    users: User[];
    canManage: boolean;
    success?: string;
}

type ViewMode = 'calendar' | 'list';

export default function ScheduleIndex({ schedules, users, canManage, success }: ScheduleIndexProps) {
    const page = usePage<SharedData>();
    const userRole = page.props.auth.user?.role;
    const isEmployee = userRole === 'employee';

    const [viewMode, setViewMode] = useState<ViewMode>('calendar');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

    // Employee list view filters and sorting
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterShiftType, setFilterShiftType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'start_time' | 'shift_type'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const handleDelete = (schedule: Schedule) => {
        if (confirm(`Are you sure you want to delete this shift?`)) {
            router.delete(destroy(schedule.id).url, {
                preserveScroll: true,
            });
        }
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
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateLong = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateToYYYYMMDD = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const getSchedulesByDate = () => {
        const grouped: Record<string, Schedule[]> = {};
        schedules.forEach((schedule) => {
            if (!grouped[schedule.date]) {
                grouped[schedule.date] = [];
            }
            grouped[schedule.date].push(schedule);
        });
        return grouped;
    };

    // Get all dates that have schedules (for calendar highlighting)
    const scheduledDates = schedules.map((schedule) => {
        const date = new Date(schedule.date);
        date.setHours(0, 0, 0, 0);
        return date;
    });

    // Get schedules for the selected date (for employee calendar view)
    const selectedDateSchedules = selectedDate
        ? schedules.filter(
              (schedule) =>
                  schedule.date === formatDateToYYYYMMDD(selectedDate),
          )
        : [];

    // Filter and sort schedules for employee list view
    const filteredAndSortedSchedules = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        
          const filtered = schedules.filter((schedule) => {
            // Only show upcoming or today's schedules
            if (schedule.date < today) {
                return false;
            }

            // Filter by status
            if (filterStatus !== 'all' && schedule.status !== filterStatus) {
                return false;
            }

            // Filter by shift type
            if (filterShiftType !== 'all' && schedule.shift_type !== filterShiftType) {
                return false;
            }

            return true;
        });

        // Sort schedules
        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'date':
                    comparison = a.date.localeCompare(b.date);
                    break;
                case 'start_time':
                    comparison = a.start_time.localeCompare(b.start_time);
                    break;
                case 'shift_type':
                    comparison = a.shift_type.localeCompare(b.shift_type);
                    break;
            }

            // If dates are equal and sorting by date, also sort by start_time
            if (sortBy === 'date' && comparison === 0) {
                comparison = a.start_time.localeCompare(b.start_time);
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [schedules, filterStatus, filterShiftType, sortBy, sortDirection]);

    const renderCalendarView = () => {
        const schedulesByDate = getSchedulesByDate();
        const dates = Object.keys(schedulesByDate).sort();
        const today = new Date().toISOString().split('T')[0];

        if (dates.length === 0) {
            return (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    No shifts found. {canManage && 'Create your first shift to get started.'}
                </div>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {dates.map((date) => {
                    const isToday = date === today;
                    return (
                        <Card key={date} className={isToday ? 'border-primary' : ''}>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{formatDate(date)}</span>
                                    {isToday && <Badge variant="default">Today</Badge>}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {schedulesByDate[date].map((schedule) => (
                                        <div
                                            key={schedule.id}
                                            className="rounded-lg border p-3 text-sm"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <div className="font-medium">
                                                        {formatTime(schedule.start_time)} -{' '}
                                                        {formatTime(schedule.end_time)}
                                                    </div>
                                                    {schedule.user && (
                                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                            <User className="h-4 w-4" />
                                                            {schedule.user.name}
                                                        </div>
                                                    )}
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="outline">
                                                            {schedule.shift_type}
                                                        </Badge>
                                                        <Badge
                                                            variant={getStatusBadgeVariant(
                                                                schedule.status,
                                                            )}
                                                        >
                                                            {schedule.status}
                                                        </Badge>
                                                    </div>
                                                    {schedule.location && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <MapPin className="h-4 w-4" />
                                                            {schedule.location}
                                                        </div>
                                                    )}
                                                    {schedule.notes && (
                                                        <div className="text-muted-foreground">
                                                            {schedule.notes}
                                                        </div>
                                                    )}
                                                    {schedule.is_recurring && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Repeat className="h-4 w-4" />
                                                            Recurring: {schedule.recurrence_pattern}
                                                        </div>
                                                    )}
                                                </div>
                                                {canManage && (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                setEditingSchedule(schedule)
                                                            }
                                                        >
                                                            <PencilIcon className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(schedule)}
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const renderListView = () => {
        if (schedules.length === 0) {
            return (
                <div className="py-12 text-center text-sm text-muted-foreground">
                    No shifts found. {canManage && 'Create your first shift to get started.'}
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Employee</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Shift Type</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Location</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                            {canManage && (
                                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map((schedule) => (
                            <tr key={schedule.id} className="border-b">
                                <td className="px-4 py-3 text-sm">{formatDate(schedule.date)}</td>
                                <td className="px-4 py-3 text-sm">
                                    {formatTime(schedule.start_time)} -{' '}
                                    {formatTime(schedule.end_time)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {schedule.user ? schedule.user.name : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Badge variant="outline">{schedule.shift_type}</Badge>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {schedule.location || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    <Badge variant={getStatusBadgeVariant(schedule.status)}>
                                        {schedule.status}
                                    </Badge>
                                </td>
                                {canManage && (
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setEditingSchedule(schedule)}
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(schedule)}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderEmployeeCalendarView = () => {
        return (
            <>
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
                                    {selectedDate.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
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

                {/* Upcoming Shifts List */}
                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Upcoming Shifts</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Filters and Sorting */}
                            <div className="mb-6 flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="filter-status" className="text-sm">
                                        Status:
                                    </Label>
                                    <Select
                                        value={filterStatus}
                                        onValueChange={setFilterStatus}
                                    >
                                        <SelectTrigger id="filter-status" className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="filter-shift-type" className="text-sm">
                                        Shift Type:
                                    </Label>
                                    <Select
                                        value={filterShiftType}
                                        onValueChange={setFilterShiftType}
                                    >
                                        <SelectTrigger id="filter-shift-type" className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="morning">Morning</SelectItem>
                                            <SelectItem value="afternoon">Afternoon</SelectItem>
                                            <SelectItem value="night">Night</SelectItem>
                                            <SelectItem value="full-day">Full Day</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Label htmlFor="sort-by" className="text-sm">
                                        Sort By:
                                    </Label>
                                    <Select
                                        value={sortBy}
                                        onValueChange={(value) =>
                                            setSortBy(
                                                value as 'date' | 'start_time' | 'shift_type',
                                            )
                                        }
                                    >
                                        <SelectTrigger id="sort-by" className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="start_time">Start Time</SelectItem>
                                            <SelectItem value="shift_type">Shift Type</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setSortDirection(
                                            sortDirection === 'asc' ? 'desc' : 'asc',
                                        )
                                    }
                                    className="flex items-center gap-2"
                                >
                                    <ArrowUpDown className="h-4 w-4" />
                                    {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                                </Button>
                            </div>

                            {/* Shifts List */}
                            {filteredAndSortedSchedules.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredAndSortedSchedules.map((schedule) => (
                                        <Card key={schedule.id}>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-center gap-4">
                                                            <div className="font-medium">
                                                                {formatDate(schedule.date)}
                                                            </div>
                                                            <div className="text-lg font-semibold">
                                                                {formatTime(
                                                                    schedule.start_time,
                                                                )}{' '}
                                                                -{' '}
                                                                {formatTime(
                                                                    schedule.end_time,
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Badge variant="outline">
                                                                {schedule.shift_type}
                                                            </Badge>
                                                            <Badge
                                                                variant={getStatusBadgeVariant(
                                                                    schedule.status,
                                                                )}
                                                            >
                                                                {schedule.status}
                                                            </Badge>
                                                            {schedule.is_recurring && (
                                                                <Badge variant="secondary" className="flex items-center gap-1.5">
                                                                    <Repeat className="h-3 w-3" />
                                                                    Recurring
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {schedule.location && (
                                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                                <MapPin className="h-4 w-4" />
                                                                {schedule.location}
                                                            </div>
                                                        )}
                                                        {schedule.break_duration > 0 && (
                                                            <div className="text-sm text-muted-foreground">
                                                                Break: {schedule.break_duration}{' '}
                                                                minutes
                                                            </div>
                                                        )}
                                                        {schedule.notes && (
                                                            <div className="rounded-md bg-muted p-3 text-sm">
                                                                {schedule.notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                                    No upcoming shifts found matching your filters
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {success && (
                    <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        {success}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Schedule</CardTitle>
                            <div className="flex items-center gap-4">
                                {!isEmployee && (
                                    <ToggleGroup
                                        type="single"
                                        value={viewMode}
                                        onValueChange={(value) => {
                                            if (value) {
                                                setViewMode(value as ViewMode);
                                            }
                                        }}
                                    >
                                        <ToggleGroupItem value="calendar" aria-label="Calendar view">
                                            <CalendarIcon className="h-4 w-4" />
                                        </ToggleGroupItem>
                                        <ToggleGroupItem value="list" aria-label="List view">
                                            <ListIcon className="h-4 w-4" />
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                )}
                                {canManage && (
                                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <PlusIcon />
                                                Add Shift
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                                            <DialogHeader>
                                                <DialogTitle>Create New Shift</DialogTitle>
                                                <DialogDescription>
                                                    Add a new shift. All required fields must be
                                                    filled.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Form
                                                action={store()}
                                                resetOnSuccess
                                                onSuccess={() => setCreateDialogOpen(false)}
                                                className="flex flex-col gap-4"
                                            >
                                                {({ processing, errors }) => (
                                                    <>
                                                        <div className="grid gap-4">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="user_id">
                                                                    Employee (Optional)
                                                                </Label>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        const input =
                                                                            document.querySelector<HTMLInputElement>(
                                                                                'input[name="user_id"]',
                                                                            );
                                                                        if (input) {
                                                                            input.value = value === 'none' ? '' : value;
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger id="user_id">
                                                                        <SelectValue placeholder="Select an employee" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="none">
                                                                            None
                                                                        </SelectItem>
                                                                        {users.map((user) => (
                                                                            <SelectItem
                                                                                key={user.id}
                                                                                value={user.id.toString()}
                                                                            >
                                                                                {user.name} ({user.email})
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <input
                                                                    type="hidden"
                                                                    name="user_id"
                                                                />
                                                                <InputError message={errors.user_id} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="date">Date</Label>
                                                                <Input
                                                                    id="date"
                                                                    name="date"
                                                                    type="date"
                                                                    required
                                                                />
                                                                <InputError message={errors.date} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="start_time">
                                                                    Start Time
                                                                </Label>
                                                                <Input
                                                                    id="start_time"
                                                                    name="start_time"
                                                                    type="time"
                                                                    required
                                                                />
                                                                <InputError message={errors.start_time} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="end_time">
                                                                    End Time
                                                                </Label>
                                                                <Input
                                                                    id="end_time"
                                                                    name="end_time"
                                                                    type="time"
                                                                    required
                                                                />
                                                                <InputError message={errors.end_time} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="break_duration">
                                                                    Break Duration (minutes)
                                                                </Label>
                                                                <Input
                                                                    id="break_duration"
                                                                    name="break_duration"
                                                                    type="number"
                                                                    min="0"
                                                                    defaultValue="0"
                                                                />
                                                                <InputError
                                                                    message={errors.break_duration}
                                                                />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="shift_type">
                                                                    Shift Type
                                                                </Label>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        const input =
                                                                            document.querySelector<HTMLInputElement>(
                                                                                'input[name="shift_type"]',
                                                                            );
                                                                        if (input) {
                                                                            input.value = value;
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger id="shift_type">
                                                                        <SelectValue placeholder="Select shift type" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="morning">
                                                                            Morning
                                                                        </SelectItem>
                                                                        <SelectItem value="afternoon">
                                                                            Afternoon
                                                                        </SelectItem>
                                                                        <SelectItem value="night">
                                                                            Night
                                                                        </SelectItem>
                                                                        <SelectItem value="full-day">
                                                                            Full Day
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <input
                                                                    type="hidden"
                                                                    name="shift_type"
                                                                    required
                                                                />
                                                                <InputError message={errors.shift_type} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="location">Location</Label>
                                                                <Input
                                                                    id="location"
                                                                    name="location"
                                                                    placeholder="Optional location"
                                                                />
                                                                <InputError message={errors.location} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="notes">Notes</Label>
                                                                <Input
                                                                    id="notes"
                                                                    name="notes"
                                                                    placeholder="Optional notes"
                                                                />
                                                                <InputError message={errors.notes} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="status">Status</Label>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        const input =
                                                                            document.querySelector<HTMLInputElement>(
                                                                                'input[name="status"]',
                                                                            );
                                                                        if (input) {
                                                                            input.value = value;
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger id="status">
                                                                        <SelectValue placeholder="Select status" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="draft">
                                                                            Draft
                                                                        </SelectItem>
                                                                        <SelectItem value="published">
                                                                            Published
                                                                        </SelectItem>
                                                                        <SelectItem value="cancelled">
                                                                            Cancelled
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <input
                                                                    type="hidden"
                                                                    name="status"
                                                                    defaultValue="draft"
                                                                />
                                                                <InputError message={errors.status} />
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="is_recurring">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="is_recurring"
                                                                        name="is_recurring"
                                                                        value="1"
                                                                        className="mr-2"
                                                                    />
                                                                    Recurring Shift
                                                                </Label>
                                                            </div>

                                                            <div className="grid gap-2">
                                                                <Label htmlFor="recurrence_pattern">
                                                                    Recurrence Pattern
                                                                </Label>
                                                                <Select
                                                                    onValueChange={(value) => {
                                                                        const input =
                                                                            document.querySelector<HTMLInputElement>(
                                                                                'input[name="recurrence_pattern"]',
                                                                            );
                                                                        if (input) {
                                                                            input.value = value;
                                                                        }
                                                                    }}
                                                                >
                                                                    <SelectTrigger id="recurrence_pattern">
                                                                        <SelectValue placeholder="Select pattern" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="daily">Daily</SelectItem>
                                                                        <SelectItem value="weekly">
                                                                            Weekly
                                                                        </SelectItem>
                                                                        <SelectItem value="monthly">
                                                                            Monthly
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <input
                                                                    type="hidden"
                                                                    name="recurrence_pattern"
                                                                />
                                                                <InputError
                                                                    message={errors.recurrence_pattern}
                                                                />
                                                            </div>
                                                        </div>

                                                        <DialogFooter>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    setCreateDialogOpen(false)
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button type="submit" disabled={processing}>
                                                                {processing && <Spinner />}
                                                                Create Shift
                                                            </Button>
                                                        </DialogFooter>
                                                    </>
                                                )}
                                            </Form>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isEmployee
                            ? renderEmployeeCalendarView()
                            : viewMode === 'calendar'
                              ? renderCalendarView()
                              : renderListView()}
                    </CardContent>
                </Card>

                {editingSchedule && (
                    <Dialog
                        open={!!editingSchedule}
                        onOpenChange={(open) => !open && setEditingSchedule(null)}
                    >
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Shift</DialogTitle>
                                <DialogDescription>
                                    Update shift information. All required fields must be filled.
                                </DialogDescription>
                            </DialogHeader>
                            <Form
                                action={update(editingSchedule.id)}
                                resetOnSuccess
                                onSuccess={() => setEditingSchedule(null)}
                                className="flex flex-col gap-4"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`edit-user_id-${editingSchedule.id}`}
                                                >
                                                    Employee (Optional)
                                                </Label>
                                                <Select
                                                    defaultValue={
                                                        editingSchedule.user_id
                                                            ? editingSchedule.user_id.toString()
                                                            : 'none'
                                                    }
                                                    onValueChange={(value) => {
                                                        const input =
                                                            document.querySelector<HTMLInputElement>(
                                                                `input[name="user_id"][data-schedule-id="${editingSchedule.id}"]`,
                                                            );
                                                        if (input) {
                                                            input.value = value === 'none' ? '' : value;
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        id={`edit-user_id-${editingSchedule.id}`}
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">None</SelectItem>
                                                        {users.map((user) => (
                                                            <SelectItem
                                                                key={user.id}
                                                                value={user.id.toString()}
                                                            >
                                                                {user.name} ({user.email})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <input
                                                    type="hidden"
                                                    name="user_id"
                                                    data-schedule-id={editingSchedule.id}
                                                    defaultValue={
                                                        editingSchedule.user_id
                                                            ? editingSchedule.user_id.toString()
                                                            : ''
                                                    }
                                                />
                                                <InputError message={errors.user_id} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor={`edit-date-${editingSchedule.id}`}>
                                                    Date
                                                </Label>
                                                <Input
                                                    id={`edit-date-${editingSchedule.id}`}
                                                    name="date"
                                                    type="date"
                                                    defaultValue={editingSchedule.date}
                                                    required
                                                />
                                                <InputError message={errors.date} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`edit-start_time-${editingSchedule.id}`}
                                                >
                                                    Start Time
                                                </Label>
                                                <Input
                                                    id={`edit-start_time-${editingSchedule.id}`}
                                                    name="start_time"
                                                    type="time"
                                                    defaultValue={editingSchedule.start_time}
                                                    required
                                                />
                                                <InputError message={errors.start_time} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`edit-end_time-${editingSchedule.id}`}
                                                >
                                                    End Time
                                                </Label>
                                                <Input
                                                    id={`edit-end_time-${editingSchedule.id}`}
                                                    name="end_time"
                                                    type="time"
                                                    defaultValue={editingSchedule.end_time}
                                                    required
                                                />
                                                <InputError message={errors.end_time} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`edit-break_duration-${editingSchedule.id}`}
                                                >
                                                    Break Duration (minutes)
                                                </Label>
                                                <Input
                                                    id={`edit-break_duration-${editingSchedule.id}`}
                                                    name="break_duration"
                                                    type="number"
                                                    min="0"
                                                    defaultValue={editingSchedule.break_duration}
                                                />
                                                <InputError message={errors.break_duration} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`edit-shift_type-${editingSchedule.id}`}
                                                >
                                                    Shift Type
                                                </Label>
                                                <Select
                                                    defaultValue={editingSchedule.shift_type}
                                                    onValueChange={(value) => {
                                                        const input =
                                                            document.querySelector<HTMLInputElement>(
                                                                `input[name="shift_type"][data-schedule-id="${editingSchedule.id}"]`,
                                                            );
                                                        if (input) {
                                                            input.value = value;
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        id={`edit-shift_type-${editingSchedule.id}`}
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="morning">Morning</SelectItem>
                                                        <SelectItem value="afternoon">
                                                            Afternoon
                                                        </SelectItem>
                                                        <SelectItem value="night">Night</SelectItem>
                                                        <SelectItem value="full-day">
                                                            Full Day
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <input
                                                    type="hidden"
                                                    name="shift_type"
                                                    data-schedule-id={editingSchedule.id}
                                                    defaultValue={editingSchedule.shift_type}
                                                    required
                                                />
                                                <InputError message={errors.shift_type} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`edit-location-${editingSchedule.id}`}
                                                >
                                                    Location
                                                </Label>
                                                <Input
                                                    id={`edit-location-${editingSchedule.id}`}
                                                    name="location"
                                                    defaultValue={editingSchedule.location || ''}
                                                    placeholder="Optional location"
                                                />
                                                <InputError message={errors.location} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor={`edit-notes-${editingSchedule.id}`}>
                                                    Notes
                                                </Label>
                                                <Input
                                                    id={`edit-notes-${editingSchedule.id}`}
                                                    name="notes"
                                                    defaultValue={editingSchedule.notes || ''}
                                                    placeholder="Optional notes"
                                                />
                                                <InputError message={errors.notes} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor={`edit-status-${editingSchedule.id}`}>
                                                    Status
                                                </Label>
                                                <Select
                                                    defaultValue={editingSchedule.status}
                                                    onValueChange={(value) => {
                                                        const input =
                                                            document.querySelector<HTMLInputElement>(
                                                                `input[name="status"][data-schedule-id="${editingSchedule.id}"]`,
                                                            );
                                                        if (input) {
                                                            input.value = value;
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        id={`edit-status-${editingSchedule.id}`}
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="published">
                                                            Published
                                                        </SelectItem>
                                                        <SelectItem value="cancelled">
                                                            Cancelled
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <input
                                                    type="hidden"
                                                    name="status"
                                                    data-schedule-id={editingSchedule.id}
                                                    defaultValue={editingSchedule.status}
                                                />
                                                <InputError message={errors.status} />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`edit-is_recurring-${editingSchedule.id}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        id={`edit-is_recurring-${editingSchedule.id}`}
                                                        name="is_recurring"
                                                        value="1"
                                                        defaultChecked={editingSchedule.is_recurring}
                                                        className="mr-2"
                                                    />
                                                    Recurring Shift
                                                </Label>
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor={`edit-recurrence_pattern-${editingSchedule.id}`}
                                                >
                                                    Recurrence Pattern
                                                </Label>
                                                <Select
                                                    defaultValue={
                                                        editingSchedule.recurrence_pattern || ''
                                                    }
                                                    onValueChange={(value) => {
                                                        const input =
                                                            document.querySelector<HTMLInputElement>(
                                                                `input[name="recurrence_pattern"][data-schedule-id="${editingSchedule.id}"]`,
                                                            );
                                                        if (input) {
                                                            input.value = value;
                                                        }
                                                    }}
                                                >
                                                    <SelectTrigger
                                                        id={`edit-recurrence_pattern-${editingSchedule.id}`}
                                                    >
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="daily">Daily</SelectItem>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <input
                                                    type="hidden"
                                                    name="recurrence_pattern"
                                                    data-schedule-id={editingSchedule.id}
                                                    defaultValue={
                                                        editingSchedule.recurrence_pattern || ''
                                                    }
                                                />
                                                <InputError message={errors.recurrence_pattern} />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setEditingSchedule(null)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing}>
                                                {processing && <Spinner />}
                                                Update Shift
                                            </Button>
                                        </DialogFooter>
                                    </>
                                )}
                            </Form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}

