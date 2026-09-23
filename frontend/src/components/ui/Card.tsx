import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  accent?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'indigo';
}

const accentStyles: Record<NonNullable<CardProps['accent']>, string> = {
  blue:    'border-l-4 border-l-blue-500',
  emerald: 'border-l-4 border-l-emerald-500',
  amber:   'border-l-4 border-l-amber-500',
  purple:  'border-l-4 border-l-purple-500',
  rose:    'border-l-4 border-l-rose-500',
  indigo:  'border-l-4 border-l-indigo-500',
};

export const Card: React.FC<CardProps> = ({ children, className = '', hoverable = false, accent }) => {
  return (
    <div
      className={[
        'bg-white rounded-2xl border border-slate-200 shadow-sm',
        hoverable ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : '',
        accent ? accentStyles[accent] : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
};
