"use client";
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useSearchParams, useRouter } from 'next/navigation';

type AuthCardProps = {};

const AuthCard: React.FC<AuthCardProps> = () => {
  const searchParams = useSearchParams();
  const shouldRegister = searchParams?.get('register') === '1';
  const [isFlipped, setIsFlipped] = useState(!!shouldRegister);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const router = useRouter();

  const handleReturnToMain = () => {
    // Navigate to landing page
    router.push('/');
  };

  return (
    <div className="perspective-1000 w-full max-w-md h-[540px] mx-auto relative">
      {/* Top-left return button, absolute so it doesn't affect card sizing */}
      <button
        onClick={handleReturnToMain}
        className="absolute left-3 top-3 text-sm text-gray-600 hover:text-gray-800 underline z-10"
      >
        Return
      </button>
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
