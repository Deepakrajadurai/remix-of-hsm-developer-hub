import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Create default channels
    console.log('Creating default channels...');
    const channels = [
        {
            id: 'general',
            name: 'General',
            type: 'text',
            description: 'General discussions and announcements',
        },
        {
            id: 'ai-news',
            name: 'AI News & Tech',
            type: 'news',
            description: 'Latest AI and technology news',
        },
        {
            id: 'memes',
            name: 'Tech Memes',
            type: 'media',
            description: 'Share your favorite tech memes',
        },
        {
            id: 'projects',
            name: 'Project Showcase',
            type: 'text',
            description: 'Show off your projects',
        },
        {
            id: 'help',
            name: 'Dev Help',
            type: 'text',
            description: 'Get help with your development questions',
        },
    ];

    for (const channel of channels) {
        await prisma.channel.upsert({
            where: { id: channel.id },
            update: {},
            create: channel,
        });
    }

    console.log('✅ Channels created');

    // Create sample events
    console.log('Creating sample events...');
    const events = [
        {
            title: 'Advanced React Patterns Workshop',
            description:
                'Deep dive into advanced React patterns including compound components, render props, and custom hooks for building scalable applications.',
            eventDate: new Date('2026-02-20T14:00:00Z'),
            location: 'Room 301, HSM Campus',
            eventType: 'workshop',
            maxAttendees: 30,
            image:
                'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop',
            price: 'Free',
        },
        {
            title: 'Winter Hackathon 2026',
            description:
                'Build innovative solutions in 48 hours with fellow developers. Prizes for best projects in categories: AI/ML, Sustainability, and Social Impact.',
            eventDate: new Date('2026-03-15T09:00:00Z'),
            location: 'Innovation Hub, Building A',
            eventType: 'hackathon',
            maxAttendees: 100,
            image:
                'https://images.unsplash.com/photo-1504384308090-c54be3855485?q=80&w=2070&auto=format&fit=crop',
            price: '€15',
        },
        {
            title: 'Monthly Developer Meetup',
            description:
                'Network with local developers, share your latest projects, and learn about new technologies in a casual setting.',
            eventDate: new Date('2026-01-25T18:00:00Z'),
            location: 'Tech Café Downtown',
            eventType: 'meetup',
            maxAttendees: 50,
            image:
                'https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=2070&auto=format&fit=crop',
            price: 'Free',
        },
        {
            title: 'TypeScript Best Practices',
            description:
                'Learn TypeScript best practices for large-scale applications including type safety, generics, and advanced patterns.',
            eventDate: new Date('2026-02-01T15:00:00Z'),
            location: 'Online (Zoom)',
            eventType: 'workshop',
            maxAttendees: null,
            image:
                'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2031&auto=format&fit=crop',
            price: 'Free',
        },
        {
            title: 'Spring Hackathon: Green Tech',
            description:
                'Focus on building sustainable technology solutions. Special track for climate and environmental projects.',
            eventDate: new Date('2026-04-10T09:00:00Z'),
            location: 'Innovation Hub',
            eventType: 'hackathon',
            maxAttendees: 80,
            image:
                'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop',
            price: '€10',
        },
        {
            title: 'AI/ML Study Group Kickoff',
            description:
                'Join our new AI/ML study group. We will cover fundamentals and work on practical projects together.',
            eventDate: new Date('2026-01-28T17:00:00Z'),
            location: 'Library, Room 205',
            eventType: 'meetup',
            maxAttendees: 25,
            image:
                'https://images.unsplash.com/photo-1555255707-c07966088b7b?q=80&w=2032&auto=format&fit=crop',
            price: 'Free',
        },
    ];

    for (const event of events) {
        await prisma.event.create({
            data: event,
        });
    }

    console.log('✅ Events created');

    // Create sample resources
    console.log('Creating sample resources...');
    const resources = [
        {
            title: 'React Documentation',
            description: 'Official React documentation and guides',
            url: 'https://react.dev',
            category: 'documentation',
            icon: '📚',
        },
        {
            title: 'TypeScript Handbook',
            description: 'Complete guide to TypeScript',
            url: 'https://www.typescriptlang.org/docs/',
            category: 'documentation',
            icon: '📖',
        },
        {
            title: 'Prisma Docs',
            description: 'Next-generation ORM for Node.js and TypeScript',
            url: 'https://www.prisma.io/docs',
            category: 'documentation',
            icon: '🔧',
        },
    ];

    for (const resource of resources) {
        await prisma.resource.create({
            data: resource,
        });
    }

    console.log('✅ Resources created');

    // Create admin user (optional)
    console.log('Creating admin user...');
    const adminEmail = 'admin@hsm.community';
    const adminPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash: adminPassword,
            fullName: 'Admin User',
            profile: {
                create: {
                    fullName: 'Admin User',
                    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
                },
            },
            userRoles: {
                create: {
                    role: 'admin',
                },
            },
        },
    });

    console.log('✅ Admin user created');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: admin123`);
    console.log('   ⚠️  Please change the password after first login!');

    console.log('\n🎉 Database seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
