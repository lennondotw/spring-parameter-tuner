import type { FC } from 'react';
import { SpringAnimationDemo } from './components/spring-animation/index.js';

export const App: FC = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-5 py-8 sm:px-8 sm:py-12">
      <SpringAnimationDemo />
    </div>
  );
};
