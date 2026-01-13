import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocation } from "react-router-dom";

const Legal = () => {
    const location = useLocation();
    const path = location.pathname;

    let title = "";
    let content = null;

    switch (path) {
        case "/privacy":
            title = "Privacy Policy";
            content = (
                <div className="space-y-4">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <h2 className="text-xl font-semibold">1. Information Collection</h2>
                    <p>
                        We collect information you provide directly to us when you create an account, update your profile, or communicate with us.
                    </p>
                    <h2 className="text-xl font-semibold">2. Use of Information</h2>
                    <p>
                        We use the information we collect to operate, maintain, and provide you with the features and functionality of the Service.
                    </p>
                    <h2 className="text-xl font-semibold">3. Information Sharing</h2>
                    <p>
                        We do not share your personal information with third parties without your consent, except as described in this policy.
                    </p>
                </div>
            );
            break;
        case "/terms":
            title = "Terms of Service";
            content = (
                <div className="space-y-4">
                    <p>Last updated: {new Date().toLocaleDateString()}</p>
                    <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.
                    </p>
                    <h2 className="text-xl font-semibold">2. Accounts</h2>
                    <p>
                        When you create an account with us, you must provide us information that is accurate, complete, and current at all times.
                    </p>
                    <h2 className="text-xl font-semibold">3. Content</h2>
                    <p>
                        Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material.
                    </p>
                </div>
            );
            break;
        case "/imprint":
            title = "Imprint (Impressum)";
            content = (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Address</h2>
                    <p>
                        Hochschule Schmalkalden<br />
                        Blechhammer 4-9<br />
                        98574 Schmalkalden<br />
                        Germany
                    </p>
                    <h2 className="text-xl font-semibold">Contact</h2>
                    <p>
                        Email: contact@hsm-developer.de<br />
                        Phone: +49 (0) 3683 688 0
                    </p>
                    <h2 className="text-xl font-semibold">Represented by</h2>
                    <p>
                        The President of Hochschule Schmalkalden
                    </p>
                </div>
            );
            break;
        default:
            title = "Legal";
            content = <p>Page not found.</p>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent/20">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-12">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-8">{title}</h1>
                    <div className="prose prose-invert max-w-none text-muted-foreground">
                        {content}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Legal;
