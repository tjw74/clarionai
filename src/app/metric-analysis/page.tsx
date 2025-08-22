'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MetricAnalysis() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Price page instead of showing Metric Analysis overview
    router.replace('/metric-analysis/price');
  }, [router]);

  // Show a brief loading message while redirecting
  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col items-center justify-center">
      <div className="text-white">Redirecting to Price Analysis...</div>
    </div>
  );
} 