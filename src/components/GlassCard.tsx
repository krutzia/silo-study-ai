import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass rounded-lg p-6',
        hover && 'transition-all duration-300 hover:shadow-glow hover:scale-[1.02]',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
