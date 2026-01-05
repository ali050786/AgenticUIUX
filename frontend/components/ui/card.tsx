import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export default function Card({ children, className = '' }: CardProps) {
    const baseStyles = "rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm p-4";

    return (
        <div className={`${baseStyles} ${className}`}>
            {children}
        </div>
    );
}
