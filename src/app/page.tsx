'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to AI Workbench instead of showing Dashboard
    router.replace('/ai-workbench');
  }, [router]);

  // Show a brief loading message while redirecting
  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col items-center justify-center">
      <div className="text-white">Redirecting to AI Workbench...</div>
    </div>
  );
}
