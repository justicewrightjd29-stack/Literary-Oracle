import React from 'react';

export const AtmosphericBackground: React.FC = () => {
  return (
    <div className="atmosphere pointer-events-none fixed inset-0 z-[-1] bg-paper">
      <div className="absolute inset-0 opacity-40 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/parchment.png')]" />
    </div>
  );
};
