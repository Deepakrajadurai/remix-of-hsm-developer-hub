import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

// Initialize Supabase client (you'll need to keep your Supabase credentials temporarily)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateUsers() {
    console.log('📦 Migrating users...');

    try {
        // Note: You'll need to export users from Supabase auth manually
        // This is a placeholder - Supabase doesn't expose auth.users via the client API
        console.log('⚠️  User migration requires manual export from Supabase Dashboard');
        console.log('   Go to: Authentication → Users → Export');
        console.log('   Then import using the CSV import script');
    } catch (error) {
        console.error('Error migrating users:', error);
    }
}

async function migrateProfiles() {
    console.log('📦 Migrating profiles...');

    try {
        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('*');

        if (error) throw error;

        for (const profile of profiles || []) {
            await prisma.profile.upsert({
                where: { id: profile.id },
                update: {
                    fullName: profile.full_name,
                    avatarUrl: profile.avatar_url,
                    updatedAt: new Date(profile.updated_at),
                },
                create: {
                    id: profile.id,
                    userId: profile.user_id,
                    fullName: profile.full_name,
                    avatarUrl: profile.avatar_url,
                    createdAt: new Date(profile.created_at),
                    updatedAt: new Date(profile.updated_at),
                },
            });
        }

        console.log(`✅ Migrated ${profiles?.length || 0} profiles`);
    } catch (error) {
        console.error('Error migrating profiles:', error);
    }
}

async function migrateChannels() {
    console.log('📦 Migrating channels...');

    try {
        const { data: channels, error } = await supabase
            .from('channels')
            .select('*');

        if (error) throw error;

        for (const channel of channels || []) {
            await prisma.channel.upsert({
                where: { id: channel.id },
                update: {
                    name: channel.name,
                    type: channel.type,
                    description: channel.description,
                },
                create: {
                    id: channel.id,
                    name: channel.name,
                    type: channel.type,
                    description: channel.description,
                    createdBy: channel.created_by,
                    createdAt: new Date(channel.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${channels?.length || 0} channels`);
    } catch (error) {
        console.error('Error migrating channels:', error);
    }
}

async function migratePosts() {
    console.log('📦 Migrating posts...');

    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*');

        if (error) throw error;

        for (const post of posts || []) {
            await prisma.post.upsert({
                where: { id: post.id },
                update: {
                    content: post.content,
                    imageUrl: post.image_url,
                    likes: post.likes || 0,
                    commentsCount: post.comments_count || 0,
                    isHidden: post.is_hidden || false,
                    reportCount: post.report_count || 0,
                    updatedAt: new Date(post.updated_at),
                },
                create: {
                    id: post.id,
                    authorId: post.author_id,
                    authorName: post.author_name,
                    authorAvatar: post.author_avatar,
                    content: post.content,
                    channelId: post.channel_id,
                    imageUrl: post.image_url,
                    likes: post.likes || 0,
                    commentsCount: post.comments_count || 0,
                    isHidden: post.is_hidden || false,
                    reportCount: post.report_count || 0,
                    createdAt: new Date(post.created_at),
                    updatedAt: new Date(post.updated_at),
                },
            });
        }

        console.log(`✅ Migrated ${posts?.length || 0} posts`);
    } catch (error) {
        console.error('Error migrating posts:', error);
    }
}

async function migrateComments() {
    console.log('📦 Migrating comments...');

    try {
        const { data: comments, error } = await supabase
            .from('comments')
            .select('*');

        if (error) throw error;

        for (const comment of comments || []) {
            await prisma.comment.upsert({
                where: { id: comment.id },
                update: {
                    content: comment.content,
                },
                create: {
                    id: comment.id,
                    postId: comment.post_id,
                    userId: comment.user_id,
                    userName: comment.user_name,
                    userAvatar: comment.user_avatar,
                    content: comment.content,
                    createdAt: new Date(comment.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${comments?.length || 0} comments`);
    } catch (error) {
        console.error('Error migrating comments:', error);
    }
}

async function migratePostLikes() {
    console.log('📦 Migrating post likes...');

    try {
        const { data: likes, error } = await supabase
            .from('post_likes')
            .select('*');

        if (error) throw error;

        for (const like of likes || []) {
            await prisma.postLike.upsert({
                where: {
                    postId_userId: {
                        postId: like.post_id,
                        userId: like.user_id,
                    },
                },
                update: {},
                create: {
                    postId: like.post_id,
                    userId: like.user_id,
                    createdAt: new Date(like.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${likes?.length || 0} post likes`);
    } catch (error) {
        console.error('Error migrating post likes:', error);
    }
}

async function migrateHashtags() {
    console.log('📦 Migrating hashtags...');

    try {
        const { data: hashtags, error } = await supabase
            .from('hashtags')
            .select('*');

        if (error) throw error;

        for (const hashtag of hashtags || []) {
            await prisma.hashtag.upsert({
                where: { id: hashtag.id },
                update: {
                    postCount: hashtag.post_count || 0,
                },
                create: {
                    id: hashtag.id,
                    name: hashtag.name,
                    postCount: hashtag.post_count || 0,
                    createdAt: new Date(hashtag.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${hashtags?.length || 0} hashtags`);
    } catch (error) {
        console.error('Error migrating hashtags:', error);
    }
}

async function migratePostHashtags() {
    console.log('📦 Migrating post-hashtag relationships...');

    try {
        const { data: postHashtags, error } = await supabase
            .from('post_hashtags')
            .select('*');

        if (error) throw error;

        for (const ph of postHashtags || []) {
            await prisma.postHashtag.upsert({
                where: {
                    postId_hashtagId: {
                        postId: ph.post_id,
                        hashtagId: ph.hashtag_id,
                    },
                },
                update: {},
                create: {
                    postId: ph.post_id,
                    hashtagId: ph.hashtag_id,
                },
            });
        }

        console.log(`✅ Migrated ${postHashtags?.length || 0} post-hashtag relationships`);
    } catch (error) {
        console.error('Error migrating post hashtags:', error);
    }
}

async function migrateChatMessages() {
    console.log('📦 Migrating chat messages...');

    try {
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*');

        if (error) throw error;

        for (const message of messages || []) {
            await prisma.chatMessage.upsert({
                where: { id: message.id },
                update: {
                    message: message.message,
                },
                create: {
                    id: message.id,
                    userId: message.user_id,
                    userName: message.user_name,
                    userAvatar: message.user_avatar,
                    message: message.message,
                    channelId: message.channel_id,
                    createdAt: new Date(message.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${messages?.length || 0} chat messages`);
    } catch (error) {
        console.error('Error migrating chat messages:', error);
    }
}

async function migrateEvents() {
    console.log('📦 Migrating events...');

    try {
        const { data: events, error } = await supabase
            .from('events')
            .select('*');

        if (error) throw error;

        for (const event of events || []) {
            await prisma.event.upsert({
                where: { id: event.id },
                update: {
                    title: event.title,
                    description: event.description,
                    eventDate: new Date(event.event_date),
                    location: event.location,
                    eventType: event.event_type,
                    maxAttendees: event.max_attendees,
                    image: event.image,
                    price: event.price,
                },
                create: {
                    id: event.id,
                    title: event.title,
                    description: event.description,
                    eventDate: new Date(event.event_date),
                    location: event.location,
                    eventType: event.event_type,
                    maxAttendees: event.max_attendees,
                    image: event.image,
                    price: event.price,
                    createdAt: new Date(event.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${events?.length || 0} events`);
    } catch (error) {
        console.error('Error migrating events:', error);
    }
}

async function migrateEventRegistrations() {
    console.log('📦 Migrating event registrations...');

    try {
        const { data: registrations, error } = await supabase
            .from('event_registrations')
            .select('*');

        if (error) throw error;

        for (const reg of registrations || []) {
            await prisma.eventRegistration.upsert({
                where: { id: reg.id },
                update: {
                    firstName: reg.first_name,
                    lastName: reg.last_name,
                    email: reg.email,
                    attendeesCount: reg.attendees_count || 1,
                    status: reg.status || 'confirmed',
                },
                create: {
                    id: reg.id,
                    eventId: reg.event_id,
                    userId: reg.user_id,
                    firstName: reg.first_name,
                    lastName: reg.last_name,
                    email: reg.email,
                    attendeesCount: reg.attendees_count || 1,
                    ticketCode: reg.ticket_code,
                    status: reg.status || 'confirmed',
                    createdAt: new Date(reg.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${registrations?.length || 0} event registrations`);
    } catch (error) {
        console.error('Error migrating event registrations:', error);
    }
}

async function migrateResources() {
    console.log('📦 Migrating resources...');

    try {
        const { data: resources, error } = await supabase
            .from('resources')
            .select('*');

        if (error) throw error;

        for (const resource of resources || []) {
            await prisma.resource.upsert({
                where: { id: resource.id },
                update: {
                    title: resource.title,
                    description: resource.description,
                    url: resource.url,
                    category: resource.category,
                    icon: resource.icon,
                },
                create: {
                    id: resource.id,
                    title: resource.title,
                    description: resource.description,
                    url: resource.url,
                    category: resource.category,
                    icon: resource.icon,
                    createdAt: new Date(resource.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${resources?.length || 0} resources`);
    } catch (error) {
        console.error('Error migrating resources:', error);
    }
}

async function migrateReports() {
    console.log('📦 Migrating reports...');

    try {
        const { data: reports, error } = await supabase
            .from('reports')
            .select('*');

        if (error) throw error;

        for (const report of reports || []) {
            await prisma.report.upsert({
                where: { id: report.id },
                update: {
                    reason: report.reason,
                    status: report.status || 'pending',
                },
                create: {
                    id: report.id,
                    postId: report.post_id,
                    reporterId: report.reporter_id,
                    reason: report.reason,
                    status: report.status || 'pending',
                    createdAt: new Date(report.created_at),
                },
            });
        }

        console.log(`✅ Migrated ${reports?.length || 0} reports`);
    } catch (error) {
        console.error('Error migrating reports:', error);
    }
}

async function main() {
    console.log('🚀 Starting Supabase to MySQL migration...\n');

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase credentials not found in environment variables');
        console.error('   Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
        process.exit(1);
    }

    try {
        await migrateUsers();
        await migrateProfiles();
        await migrateChannels();
        await migratePosts();
        await migrateHashtags();
        await migratePostHashtags();
        await migrateComments();
        await migratePostLikes();
        await migrateChatMessages();
        await migrateEvents();
        await migrateEventRegistrations();
        await migrateResources();
        await migrateReports();

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n⚠️  Important next steps:');
        console.log('   1. Verify all data in MySQL using: npx prisma studio');
        console.log('   2. Export and import user authentication data manually');
        console.log('   3. Test the application thoroughly');
        console.log('   4. Update environment variables to use MySQL');
        console.log('   5. Keep Supabase active until fully tested');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error('❌ Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
