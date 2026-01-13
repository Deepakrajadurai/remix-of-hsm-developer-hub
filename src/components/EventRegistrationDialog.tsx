import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EventRegistrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    eventTitle: string;
}

export function EventRegistrationDialog({ open, onOpenChange, eventTitle }: EventRegistrationDialogProps) {
    const { toast } = useToast();
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
        setLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setLoading(false);
        onOpenChange(false);

        // Simulate email trigger
        toast({
            title: "Registration Successful!",
            description: `Ticket for "${eventTitle}" has been sent to ${formData.email}.`,
        });

        if (formData.alternateEmail) {
            setTimeout(() => {
                toast({
                    title: "Ticket Shared",
                    description: `A copy of the ticket was also sent to ${formData.alternateEmail}.`,
                });
            }, 1000);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Register for Event</DialogTitle>
                    <DialogDescription>
                        {eventTitle}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="surname">Surname</Label>
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
