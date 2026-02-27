import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn } from 'lucide-react';

export default function LoginButton() {
  const { clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={disabled}
      variant="outline"
      size="sm"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
}
