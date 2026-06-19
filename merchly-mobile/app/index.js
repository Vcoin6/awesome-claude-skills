import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth';
import { Loading } from '../src/ui';

// Entry: wait for session restore, then go straight to the marketplace tabs.
export default function Index() {
  const { loading } = useAuth();
  if (loading) return <Loading />;
  return <Redirect href="/(tabs)" />;
}
