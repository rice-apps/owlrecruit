"use client"
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";

interface PositionCardProps {
  title: string;
  dueDate: string;
  role: string;
}

export default function PositionCard({ title, dueDate, role }: PositionCardProps) {
  const [pencilSize, setPencilSize] = useState(24);

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 640) {
        setPencilSize(16);
      } else if (window.innerWidth < 1024) {
        setPencilSize(20);
      } else {
        setPencilSize(24);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div className="bg-gray-200 dark:bg-gray-800 rounded-lg p-8 flex-1 relative">
      <button className="absolute top-8 right-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
        <Pencil size={pencilSize} />
      </button>
      <div className="flex flex-col gap-2">
        <button className="font-semibold text-2xl text-left">
            <h3>{title}</h3>
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-bold">#</span>
          <span>DUE {dueDate}</span>
        </div>
      </div>
    </div>
  );
}
