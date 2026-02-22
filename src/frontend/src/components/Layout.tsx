import { Link, useLocation } from '@tanstack/react-router';
import { Shield, FileText, Plus, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginButton from './LoginButton';
import { useGetCallerUserProfile } from '../hooks/useGetCallerUserProfile';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAttackPathPage = location.pathname === '/attack-path';
  const { data: userProfile } = useGetCallerUserProfile();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Threat Hunt Portal</h1>
                <p className="text-xs text-muted-foreground">MITRE ATT&CK Report System</p>
              </div>
            </Link>
            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/">
                  <FileText className="h-4 w-4 mr-2" />
                  Reports
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/attack-path">
                  <Network className="h-4 w-4 mr-2" />
                  Attack Path
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/create">
                  <Plus className="h-4 w-4 mr-2" />
                  New Report
                </Link>
              </Button>
              {userProfile && (
                <div className="ml-2 px-3 py-1 bg-primary/10 rounded-full text-sm font-medium">
                  {userProfile.name}
                </div>
              )}
              <LoginButton />
            </nav>
          </div>
        </div>
      </header>

      {isHomePage && (
        <div className="relative overflow-hidden bg-gradient-to-br from-background via-accent/5 to-background">
          <div className="container mx-auto px-4 py-8">
            <img
              src="/assets/generated/hero-banner.dim_1200x400.png"
              alt="Threat Hunting Banner"
              className="w-full h-auto rounded-lg shadow-2xl border border-border/50"
            />
          </div>
        </div>
      )}

      <main className={isAttackPathPage ? 'w-full' : 'container mx-auto px-4 py-8'}>
        {children}
      </main>

      <footer className="border-t border-border mt-16 py-8 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Threat Hunt Portal. Built with ❤️ using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'threat-hunt-portal'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
