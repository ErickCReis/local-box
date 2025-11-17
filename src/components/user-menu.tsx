import { Link, useNavigate } from '@tanstack/react-router'
import { CreditCard, LogOut, User } from 'lucide-react'
import { api } from '@convex/_generated/api'
import { useStableQuery } from '@/hooks/use-stable-query'
import { useHostConnected } from '@/providers/host-connection'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function UserMenu() {
  const user = useStableQuery(api.auth.getCurrentUser)
  const billingConfig = useStableQuery(api.billing.getBillingConfig)
  const { authClient } = useHostConnected()
  const navigate = useNavigate()

  if (!user) {
    return null
  }

  const handleSignOut = () => {
    authClient.signOut().then(() => {
      navigate({ to: '/dashboard/sign-in' })
    })
  }

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      }
      return name[0].toUpperCase() || 'U'
    }
    if (email) {
      return email[0].toUpperCase() || 'U'
    }
    return 'U'
  }

  const getRoleBadgeVariant = (role?: string | null) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto py-1.5 px-2"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email || 'No email'}
            </p>
            <Badge
              variant={getRoleBadgeVariant(user.role)}
              className="mt-1 w-fit"
            >
              {user.role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        {billingConfig?.billingEnabled && (
          <DropdownMenuItem asChild>
            <Link to="/dashboard/billing" className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              Billing
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} variant="destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
