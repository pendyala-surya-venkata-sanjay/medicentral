import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

const AnimatedCounter = ({ value, duration = 0.8, className = '' }) => {
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(Number(value) || 0);
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [value, spring]);

  return (
    <motion.span className={className} key={value}>
      {display}
    </motion.span>
  );
};

export default AnimatedCounter;
