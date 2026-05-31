"use client";
import { motion } from "framer-motion";

type Event = {
  time: string;
  description: string;
  type: "transfer" | "split" | "detection" | "freeze";
};

export default function TimelineReplay({ events }: { events: Event[] }) {
  return (
    <div className="space-y-4">
      {events.map((event, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.5 }}
          className="flex items-center space-x-3"
        >
          <div
            className={`w-3 h-3 rounded-full ${
              event.type === "transfer"
                ? "bg-blue-500"
                : event.type === "split"
                  ? "bg-yellow-500"
                  : event.type === "detection"
                    ? "bg-red-500"
                    : "bg-purple-500"
            }`}
          />
          <div>
            <p className="text-sm text-gray-400">{event.time}</p>
            <p className="text-sm font-medium">{event.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
