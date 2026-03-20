"use client";
import React from "react";

type BoxProps = {
  children: React.ReactNode;
  className?: string;
};

export const Box = ({ children, className = "" }: BoxProps) => {
  return (
    <div
      className={`
        bg-white rounded-2xl p-8 border border-gray-200
        shadow-[0px_0px_10px_4px_rgba(0,0,0,0.1)]
        ${className}
      `}
    >
      {children}
    </div>
  );
};