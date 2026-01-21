import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { toast } = useToast();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                const res = await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    toast({
                        title: 'Email Verified',
                        description: 'Your email has been successfully verified. You can now log in.',
                    });
                } else {
                    setStatus('error');
                    toast({
                        title: 'Verification Failed',
                        description: data.error || 'Invalid token',
                        variant: 'destructive',
                    });
                }
            } catch (err) {
                setStatus('error');
                toast({
                    title: 'Error',
                    description: 'Something went wrong verifying your email.',
                    variant: 'destructive',
                });
            }
        };

        verify();
    }, [token, toast]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-border/50">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl flex flex-col items-center gap-4">
                        {status === 'verifying' && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
                        {status === 'success' && <CheckCircle className="h-12 w-12 text-green-500" />}
                        {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}

                        {status === 'verifying' && 'Verifying Email...'}
                        {status === 'success' && 'Email Verified!'}
                        {status === 'error' && 'Verification Failed'}
                    </CardTitle>
                    <CardDescription>
                        {status === 'verifying' && 'Please wait while we verify your email address.'}
                        {status === 'success' && 'Your account is now active.'}
                        {status === 'error' && 'The verification link is invalid or has expired.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    {status !== 'verifying' && (
                        <Button
                            variant={status === 'success' ? 'gradient' : 'outline'}
                            onClick={() => navigate('/auth')}
                            className="w-full"
                        >
                            Back to Login
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmail;
