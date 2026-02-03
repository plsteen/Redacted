"use client";

import { useEffect, useState } from "react";

interface TaskAnsweredToastProps {
  playerName: string;
  playerColor: string;
  taskNumber: number;
  taskTotal: number;
}

export function TaskAnsweredToast({ playerName, playerColor, taskNumber, taskTotal }: TaskAnsweredToastProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Auto-hide after 4 seconds
    const timer = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="glass-panel px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: playerColor }}
        />
        <div className="text-xs text-white">
          <span className="font-semibold">{playerName}</span>
          <span className="text-[var(--color-muted)] ml-1">
            solved task {taskNumber}/{taskTotal}
          </span>
        </div>
      </div>
    </div>
  );
}

export interface Toast {
  id: string;
  playerName: string;
  playerColor: string;
  taskNumber: number;
  taskTotal: number;
}

interface ToastContainerProps {
  toasts: Toast[];
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <TaskAnsweredToast
            playerName={toast.playerName}
            playerColor={toast.playerColor}
            taskNumber={toast.taskNumber}
            taskTotal={toast.taskTotal}
          />
        </div>
      ))}
    </div>
  );
}
