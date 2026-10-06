import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/bus/login');
  }, [router]);

  return null;
}

export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/bus/login',
      permanent: false,
    },
  };
}
