import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 ${
        hoverable ? 'transition-all hover:shadow-md hover:border-brand-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
