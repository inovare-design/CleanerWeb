"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

type DraggableAppointmentProps = {
    appointment: any;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    disabled?: boolean;
};

export function DraggableAppointment({ appointment, children, className, style, disabled }: DraggableAppointmentProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: appointment.id,
        data: {
            appointment,
            // We can pass original start time to calculate delta
            originalStartTime: appointment.startTime,
            originalEmployeeId: appointment.employeeId
        },
        disabled
    });

    const combinedStyle: React.CSSProperties = {
        ...style,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 50 : style?.zIndex,
        opacity: isDragging ? 0.8 : 1,
        position: style?.position || 'relative', // Ensure absolute positioning context works if passed
    };

    return (
        <div
            ref={setNodeRef}
            style={combinedStyle}
            {...listeners}
            {...attributes}
            className={cn(className, isDragging && "shadow-xl ring-2 ring-violet-500 ring-opacity-50")}
        >
            {children}
        </div>
    );
}
