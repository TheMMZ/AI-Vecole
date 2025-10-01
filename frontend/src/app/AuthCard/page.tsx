import dynamic from 'next/dynamic';

const AuthCard = dynamic(() => import('./AuthCard'), { ssr: false });

export default function AuthCardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f3f8fc]">
      <AuthCard />
    </div>
  );
}
