import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import AppRoutes from '@/routes/AppRoutes';
import { refreshToken } from '@/features/auth/authSlice';

function App() {
  const dispatch = useDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    dispatch(refreshToken()).finally(() => setIsInitialized(true));
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <AppRoutes />;
}

export default App;
