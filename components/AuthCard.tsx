import React from "react";

export default function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md w-full bg-card rounded-2xl p-8 shadow-lg">
      {children}
    </div>
  )
}