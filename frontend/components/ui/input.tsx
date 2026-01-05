import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export default function Input({ className = '', ...props }: InputProps) {
    const baseStyles = "flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <input
            className={`${baseStyles} ${className}`}
            {...props}
        />
    );
}
