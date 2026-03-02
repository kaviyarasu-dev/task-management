import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useVerifyInvitation } from '@/features/users/hooks/useInvitations';
import { useInvitationMutations } from '@/features/users/hooks/useInvitationMutations';
import {
  acceptInvitationSchema,
  type AcceptInvitationFormData,
} from '@/features/users/validators/invitation.validators';
import { useAuthStore } from '@/features/auth';
import { cn } from '@/shared/lib/utils';
import type { UserRole } from '@/shared/types/api.types';

export function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { data: verification, isLoading, error } = useVerifyInvitation(token ?? '');
  const { acceptInvitation } = useInvitationMutations();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
  });

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token) return;

    const response = await acceptInvitation.mutateAsync({
      token,
      name: data.name,
      password: data.password,
    });

    const { user, accessToken, refreshToken } = response.data;

    setAuth(
      {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role as UserRole,
        tenantId: user.tenantId,
        isEmailVerified: false,
        createdAt: '',
        updatedAt: '',
      },
      accessToken,
      refreshToken
    );
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !verification?.data?.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
            <XCircle className="mx-auto h-12 w-12 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">Invalid Invitation</h1>
            <p className="mt-2 text-muted-foreground">
              This invitation link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { email, organizationName } = verification.data;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-border bg-background p-8 shadow-sm">
          {/* Header */}
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-xl font-semibold text-foreground">You're Invited!</h1>
            <p className="mt-2 text-muted-foreground">
              Join <strong className="text-foreground">{organizationName}</strong> as{' '}
              <strong className="text-foreground">{email}</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Your Name
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className={cn(
                  'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  errors.name && 'border-destructive'
                )}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className={cn(
                  'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  errors.password && 'border-destructive'
                )}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                id="confirmPassword"
                className={cn(
                  'mt-1 block w-full rounded-md border border-border bg-background px-3 py-2',
                  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
                  errors.confirmPassword && 'border-destructive'
                )}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={acceptInvitation.isPending}
              className={cn(
                'mt-2 flex w-full items-center justify-center rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {acceptInvitation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Join Team'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
