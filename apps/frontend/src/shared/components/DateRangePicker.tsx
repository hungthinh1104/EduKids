import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange, DayPicker } from 'react-day-picker';
import * as Popover from '@radix-ui/react-popover';
import { vi } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

interface DateRangePickerProps {
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    placeholder?: string;
    className?: string;
}

export function DateRangePicker({ date, setDate, placeholder = 'Chọn ngày...', className = '' }: DateRangePickerProps) {
    return (
        <Popover.Root>
            <Popover.Trigger asChild>
                <button
                    className={`flex items-center gap-2 px-4 py-2 bg-white border-2 border-border rounded-xl text-sm font-heading font-bold text-body hover:border-primary/50 transition-colors shadow-sm ${className}`}
                >
                    <CalendarIcon size={16} className="text-primary" />
                    {date?.from ? (
                        date.to ? (
                            <>
                                {format(date.from, 'dd/MM/yyyy', { locale: vi })} -{' '}
                                {format(date.to, 'dd/MM/yyyy', { locale: vi })}
                            </>
                        ) : (
                            format(date.from, 'dd/MM/yyyy', { locale: vi })
                        )
                    ) : (
                        <span>{placeholder}</span>
                    )}
                </button>
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Content
                    className="z-50 bg-white border-2 border-border rounded-2xl p-2 shadow-xl"
                    align="end"
                    sideOffset={8}
                >
                    <DayPicker
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        locale={vi}
                        classNames={{
                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                            month: "space-y-4",
                            caption: "flex justify-center pt-1 relative items-center",
                            caption_label: "text-sm font-heading font-bold text-heading",
                            nav: "space-x-1 flex items-center",
                            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                            nav_button_previous: "absolute left-1",
                            nav_button_next: "absolute right-1",
                            table: "w-full border-collapse space-y-1",
                            head_row: "flex",
                            head_cell: "text-caption rounded-md w-9 font-normal text-[0.8rem]",
                            row: "flex w-full mt-2",
                            cell: "text-center text-sm p-0 flex-1 relative [&:has([aria-selected])]:bg-primary-light first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                            day: "h-9 w-9 p-0 font-normal hover:bg-background rounded-md text-body aria-selected:opacity-100",
                            day_selected: "bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white",
                            day_today: "bg-accent-light text-accent font-bold",
                            day_outside: "text-caption opacity-50",
                            day_disabled: "text-caption opacity-50",
                            day_range_middle: "aria-selected:bg-primary-light aria-selected:text-primary aria-selected:rounded-none",
                            day_hidden: "invisible",
                        }}
                    />
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
}
