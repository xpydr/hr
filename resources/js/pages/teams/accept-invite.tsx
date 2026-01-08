import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login, register } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

interface Team {
    id: number;
    name: string;
}

interface Invitation {
    token: string;
    email: string;
    team: Team;
    has_otp: boolean;
}

interface AcceptInviteProps {
    invitation: Invitation;
    emailMismatch?: boolean;
}

export default function AcceptInvite({ invitation, emailMismatch = false }: AcceptInviteProps) {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = !!auth.user;
    const isEmailMismatch = emailMismatch && isAuthenticated;

    const { data, setData, post, processing, errors } = useForm({
        token: invitation.token,
        email: invitation.email,
        otp_code: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/teams/accept-invite');
    };

    const loginUrl = login({ query: { invitation_token: invitation.token } });
    const registerUrl = register({ query: { invitation_token: invitation.token } });

    return (
        <AuthLayout
            title="Accept Team Invitation"
            description={`You've been invited to join ${invitation.team.name}`}
        >
            <Head title="Accept Invitation" />
            <Card>
                <CardHeader>
                    <CardTitle>Join {invitation.team.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    {isEmailMismatch && (
                        <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            This invitation was sent to <strong>{invitation.email}</strong>, but you are currently signed in as <strong>{auth.user?.email}</strong>. Please sign out and sign in with the correct email address.
                        </div>
                    )}

                    {!isAuthenticated && (
                        <div className="mb-4 rounded-md bg-muted p-4">
                            <p className="mb-3 text-sm font-medium">
                                You need to sign in or create an account to accept this invitation.
                            </p>
                            <p className="mb-3 text-sm text-muted-foreground">
                                Please use the email address <strong>{invitation.email}</strong> to sign in or register.
                            </p>
                            <div className="flex flex-col gap-2">
                                <Button asChild variant="default" className="w-full">
                                    <Link href={loginUrl.url}>
                                        Sign in
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href={registerUrl.url}>
                                        Create account
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="flex flex-col gap-4"
                    >
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    readOnly
                                    value={data.email}
                                    className="bg-muted"
                                    placeholder="your@email.com"
                                />
                                <p className="text-xs text-muted-foreground">
                                    This email is locked to match the invitation.
                                </p>
                                <InputError message={errors.email} />
                            </div>

                            {invitation.has_otp && (
                                <div className="grid gap-2">
                                    <Label htmlFor="otp_code">OTP Code</Label>
                                    <Input
                                        id="otp_code"
                                        name="otp_code"
                                        type="text"
                                        maxLength={6}
                                        value={data.otp_code}
                                        onChange={(e) => setData('otp_code', e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                    />
                                    <InputError message={errors.otp_code} />
                                    <p className="text-sm text-muted-foreground">
                                        Enter the 6-digit OTP code sent to your email, or use the magic link.
                                    </p>
                                </div>
                            )}
                        </div>

                        {isAuthenticated && !isEmailMismatch && (
                            <div className="flex flex-col gap-2">
                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing && <Spinner />}
                                    Accept Invitation
                                </Button>
                                {invitation.has_otp && (
                                    <p className="text-sm text-center text-muted-foreground">
                                        You can also use the magic link from your email instead of the OTP code.
                                    </p>
                                )}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}

