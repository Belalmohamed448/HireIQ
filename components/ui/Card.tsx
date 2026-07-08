import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
}

export default function Card({ children }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      {children}
    </div>
  );
}