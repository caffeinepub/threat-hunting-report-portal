import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-4 rounded-full bg-primary/10">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Threat Hunt Portal</CardTitle>
          <CardDescription className="text-base">
            Secure authentication required to access the MITRE ATT&CK Report System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Lock className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p>
                This application uses secure authentication to protect sensitive threat intelligence data.
                Click below to authenticate and access your reports.
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Authenticating...
              </>
            ) : (
              'Login to Continue'
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By logging in, you agree to secure handling of threat intelligence data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
