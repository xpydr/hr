import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Form, Head } from '@inertiajs/react';

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
}

export default function AcceptInvite({ invitation }: AcceptInviteProps) {
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
                    <Form
                        action="/teams/accept-invite"
                        method="post"
                        className="flex flex-col gap-4"
                    >
                        {({ processing, errors, data, setData }) => (
                            <>
                                <input type="hidden" name="token" value={invitation.token} />
                                
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            value={data.email || invitation.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="your@email.com"
                                        />
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
                                                value={data.otp_code || ''}
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
                            </>
                        )}
                    </Form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}

