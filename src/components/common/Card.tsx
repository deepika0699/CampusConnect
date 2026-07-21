import React, { HTMLAttributes } from 'react';
import { motion } from 'motion/react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  glass?: boolean;
  animate?: boolean;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  glass = false,
  animate = false,
  delay = 0,
  ...props
}) => {
  const baseStyle = `bg-white border border-slate-100/80 rounded-2xl overflow-hidden shadow-soft`;
  const glassStyle = glass ? 'bg-white/85 backdrop-blur-sm border border-white/40' : '';
  const hoverStyle = hoverable ? 'hover:shadow-soft-lg hover:border-slate-200/80 transition-all duration-300 hover:-translate-y-1' : '';

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
        className={`${baseStyle} ${glassStyle} ${hoverStyle} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={`${baseStyle} ${glassStyle} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-5 py-4 border-b border-slate-50/80 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`px-5 py-4 bg-slate-50/50 border-t border-slate-50 ${className}`} {...props}>
      {children}
    </div>
  );
};
export default Card;
