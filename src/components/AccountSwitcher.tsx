import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Mail, User } from "lucide-react";
import { oauthService, OAuthIdentity } from "@/services/oauthService";

interface Props {
  className?: string;
}

export default function AccountSwitcher({ className }: Props) {
  const [identities, setIdentities] = useState<OAuthIdentity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const list = await oauthService.listIdentities();
      setIdentities(list.filter(i => i.provider === 'google'));
      setLoading(false);
    };
    load();
  }, []);

  const onSelect = async (email: string | null) => {
    if (!email) return;
    await oauthService.switchToGoogle(email);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Mail className="w-4 h-4 mr-2" />
          Accounts
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[14rem]">
        {loading && (
          <DropdownMenuItem disabled>
            Loading...
          </DropdownMenuItem>
        )}
        {!loading && identities.length === 0 && (
          <DropdownMenuItem disabled>
            No Google accounts
          </DropdownMenuItem>
        )}
        {!loading && identities.map((id) => (
          <DropdownMenuItem key={id.provider_sub} onClick={() => onSelect(id.email)}>
            {id.picture ? (
              <img src={id.picture} alt={id.email || ''} className="w-5 h-5 rounded-full mr-2" />
            ) : (
              <User className="w-4 h-4 mr-2" />
            )}
            <span className="tahoe-text">{id.email || 'Unknown'}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => oauthService.switchToGoogle(identities[0]?.email || '')}>
          <Mail className="w-4 h-4 mr-2" />
          Add account
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            const result = await oauthService.verifyCurrentAccount();
            alert(JSON.stringify(result, null, 2));
          }}
        >
          <User className="w-4 h-4 mr-2" />
          Verify current account
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
