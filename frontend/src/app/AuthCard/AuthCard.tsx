"use client";
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthCard: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="perspective-1000 w-full max-w-md h-[540px] mx-auto">
      <div
        className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
      >
        <LoginForm onFlip={handleFlip} />
        <RegisterForm onFlip={handleFlip} />
      </div>
    </div>
  );
};

export default AuthCard;
