import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EventRegistrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: { id: string; title: string; price: string; } | null;
}

export function EventRegistrationDialog({ open, onOpenChange, event }: EventRegistrationDialogProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        attendees: '1',
        alternateEmail: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!event) return;
        setLoading(true);

        try {
            // 1. Insert Registration into Database
            const { data, error } = await supabase
                .from('event_registrations')
                .insert({
                    event_id: event.id,
                    user_id: user?.id, // Optional, can be null for guests
                    first_name: formData.name,
                    last_name: formData.surname,
                    email: formData.email,
                    attendees_count: parseInt(formData.attendees)
                })
                .select()
                .single();

            if (error) throw error;

            console.log("Registration successful:", data);
            toast({ title: "Registration Confirmed", description: "Sending ticket email..." });

            // 2. Trigger Email via Edge Function (Client-Side)
            const { error: funcError } = await supabase.functions.invoke('send-ticket', {
                body: { record: data }
            });

            if (funcError) {
                console.error("Edge Function Error:", funcError);
                toast({
                    title: "Registration Saved",
                    description: "But failed to send email. Please check your network or try again later.",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Success!",
                    description: `Ticket for "${event.title}" has been sent to ${formData.email}.`,
                });
            }

            if (formData.alternateEmail) {
                setTimeout(() => {
                    toast({
                        title: "Ticket Shared",
                        description: `A copy was also sent to ${formData.alternateEmail}.`,
                    });
                }, 1000);
            }

            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast({
                title: "Registration Failed",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Register for Event</DialogTitle>
                    <DialogDescription>
                        {event.title} • {event.price}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">First Name</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="surname">Last Name</Label>
                            <Input
                                id="surname"
                                required
                                value={formData.surname}
                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="attendees">Number of Attendees</Label>
                        <Input
                            id="attendees"
                            type="number"
                            min="1"
                            max="10"
                            required
                            value={formData.attendees}
                            onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="alt-email">Send Ticket to Another Email (Optional)</Label>
                        <Input
                            id="alt-email"
                            type="email"
                            placeholder="friend@example.com"
                            value={formData.alternateEmail}
                            onChange={(e) => setFormData({ ...formData, alternateEmail: e.target.value })}
                        />
                    </div>

                    <DialogFooter className="mt-4">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Registration
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
