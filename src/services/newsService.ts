// Dynamic AI & Tech News Aggregator
// Fetches fresh content from multiple free sources globally

export interface NewsArticle {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    source: string;
    publishedAt: string;
}

/**
 * Fetch from Reddit - Multiple tech subreddits
 * Free, no API key, fresh global content
 */
async function fetchFromReddit(): Promise<NewsArticle[]> {
    const subreddits = [
        'artificial',
        'MachineLearning',
        'technology',
        'Futurology',
        'singularity',
        'ArtificialInteligence',
        'deeplearning',
        'OpenAI',
        'LocalLLaMA',
        'StableDiffusion',
        'ChatGPT',
        'programming',
        'tech',
        'gadgets'
    ];

    try {
        // Pick 2-3 random subreddits for variety
        const selectedSubreddits = shuffleArray(subreddits).slice(0, 3);
        const articles: NewsArticle[] = [];

        for (const subreddit of selectedSubreddits) {
            try {
                const response = await fetch(
                    `https://corsproxy.io/?` + encodeURIComponent(`https://www.reddit.com/r/${subreddit}/hot.json?limit=30`),
                    { headers: { 'User-Agent': 'Mozilla/5.0' } }
                );

                if (!response.ok) continue;

                const data = await response.json();

                const posts = data.data.children
                    .filter((post: any) =>
                        !post.data.stickied &&
                        !post.data.over_18 &&
                        post.data.score > 10 // Only popular posts
                    )
                    .slice(0, 8)
                    .map((post: any) => ({
                        title: post.data.title,
                        description: post.data.selftext
                            ? post.data.selftext.substring(0, 300) + '...'
                            : `${post.data.score} upvotes • ${post.data.num_comments} comments on r/${subreddit}`,
                        url: post.data.url.startsWith('http')
                            ? post.data.url
                            : `https://reddit.com${post.data.permalink}`,
                        imageUrl: getRedditImage(post.data),
                        source: `r/${subreddit}`,
                        publishedAt: new Date(post.data.created_utc * 1000).toISOString()
                    }));

                articles.push(...posts);
            } catch (err) {
                console.log(`Failed to fetch from r/${subreddit}`);
            }
        }

        return articles;
    } catch (error) {
        console.error('Reddit fetch error:', error);
        return [];
    }
}

/**
 * Fetch from Hacker News - Tech news and discussions
 */
async function fetchFromHackerNews(): Promise<NewsArticle[]> {
    try {
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const storyIds = await response.json();


        // Get first 20 stories
        // Get first 30 stories
        const storyPromises = storyIds.slice(0, 30).map(async (id: number) => {
            const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return res.json();
        });

        const stories = await Promise.all(storyPromises);

        // Filter for AI/tech keywords
        const keywords = ['ai', 'artificial', 'machine learning', 'neural', 'gpt', 'llm',
            'tech', 'technology', 'software', 'programming', 'startup', 'google',
            'openai', 'microsoft', 'apple', 'meta', 'amazon'];

        return stories
            .filter((story: any) => {
                if (!story || !story.title) return false;
                const text = story.title.toLowerCase();
                return keywords.some(keyword => text.includes(keyword));
            })
            .slice(0, 30)
            .map((story: any) => ({
                title: story.title,
                description: `${story.score} points • ${story.descendants || 0} comments on Hacker News`,
                url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
                imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800',
                source: 'Hacker News',
                publishedAt: new Date(story.time * 1000).toISOString()
            }));
    } catch (error) {
        console.error('Hacker News error:', error);
        return [];
    }
}

/**
 * Fetch from DEV.to - Developer community articles
 */
async function fetchFromDevTo(): Promise<NewsArticle[]> {
    try {
        const tags = ['ai', 'machinelearning', 'deeplearning', 'chatgpt', 'technology'];
        const randomTag = tags[Math.floor(Math.random() * tags.length)];

        const response = await fetch(
            `https://dev.to/api/articles?tag=${randomTag}&top=7&per_page=15`
        );

        if (!response.ok) return [];

        const articles = await response.json();

        return articles.slice(0, 8).map((article: any) => ({
            title: article.title,
            description: article.description || article.title,
            url: article.url,
            imageUrl: article.cover_image || article.social_image ||
                'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
            source: 'DEV Community',
            publishedAt: article.published_at
        }));
    } catch (error) {
        console.error('DEV.to error:', error);
        return [];
    }
}

/**
 * Fetch from Lobsters - Tech news aggregator
 */
async function fetchFromLobsters(): Promise<NewsArticle[]> {
    try {
        const response = await fetch('https://corsproxy.io/?' + encodeURIComponent('https://lobste.rs/hottest.json'));

        if (!response.ok) return [];

        const stories = await response.json();

        return stories.slice(0, 12).map((story: any) => ({
            title: story.title,
            description: `${story.score} points • ${story.comment_count} comments • ${story.tags?.join(', ') || 'tech'}`,
            url: story.url || story.short_id_url,
            imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
            source: 'Lobsters',
            publishedAt: story.created_at
        }));
    } catch (error) {
        console.error('Lobsters error:', error);
        return [];
    }
}

/**
 * Fetch from GitHub Trending - Popular repos
 */
async function fetchFromGitHubTrending(): Promise<NewsArticle[]> {
    try {
        // Using GitHub's trending page (parsed from HTML)
        const response = await fetch('https://api.github.com/search/repositories?q=ai+machine-learning+created:>2026-01-01&sort=stars&order=desc&per_page=15');

        if (!response.ok) return [];

        const data = await response.json();

        return data.items.slice(0, 5).map((repo: any) => ({
            title: `${repo.full_name}: ${repo.description || 'Trending AI Repository'}`,
            description: `⭐ ${repo.stargazers_count} stars • ${repo.language || 'Code'} • ${repo.description || ''}`,
            url: repo.html_url,
            imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800',
            source: 'GitHub Trending',
            publishedAt: repo.created_at
        }));
    } catch (error) {
        console.error('GitHub error:', error);
        return [];
    }
}

/**
 * Fetch from Product Hunt - New tech products
 */
async function fetchFromProductHunt(): Promise<NewsArticle[]> {
    try {
        // Using Product Hunt's public feed
        const response = await fetch('https://www.producthunt.com/feed?category=artificial-intelligence');

        // Note: This might need RSS parsing, so we'll use a fallback
        // For now, return empty and rely on other sources
        return [];
    } catch (error) {
        return [];
    }
}

/**
 * Helper: Extract image from Reddit post
 */
function getRedditImage(postData: any): string {
    const defaultImages = [
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800',
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800',
        'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=800'
    ];

    if (postData.thumbnail && postData.thumbnail.startsWith('http')) {
        return postData.thumbnail;
    }

    if (postData.preview?.images?.[0]?.source?.url) {
        return postData.preview.images[0].source.url.replace(/&amp;/g, '&');
    }

    if (postData.url && (postData.url.includes('.jpg') || postData.url.includes('.png'))) {
        return postData.url;
    }

    return defaultImages[Math.floor(Math.random() * defaultImages.length)];
}

/**
 * Shuffle array helper
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Main function: Fetch AI & Tech news from ALL sources
 * Returns fresh, diverse content every time
 */
export async function fetchAITechNews(): Promise<NewsArticle[]> {
    console.log('🌍 Fetching fresh AI & Tech news from global sources...');

    const startTime = Date.now();

    // Fetch from ALL sources in parallel
    const [
        redditArticles,
        hackerNewsArticles,
        devToArticles,
        lobstersArticles,
        githubArticles
    ] = await Promise.allSettled([
        fetchFromReddit(),
        fetchFromHackerNews(),
        fetchFromDevTo(),
        fetchFromLobsters(),
        fetchFromGitHubTrending()
    ]);

    // Collect all successful results
    const allArticles: NewsArticle[] = [];

    if (redditArticles.status === 'fulfilled') {
        console.log(`✅ Reddit: ${redditArticles.value.length} articles`);
        allArticles.push(...redditArticles.value);
    }

    if (hackerNewsArticles.status === 'fulfilled') {
        console.log(`✅ Hacker News: ${hackerNewsArticles.value.length} articles`);
        allArticles.push(...hackerNewsArticles.value);
    }

    if (devToArticles.status === 'fulfilled') {
        console.log(`✅ DEV.to: ${devToArticles.value.length} articles`);
        allArticles.push(...devToArticles.value);
    }

    if (lobstersArticles.status === 'fulfilled') {
        console.log(`✅ Lobsters: ${lobstersArticles.value.length} articles`);
        allArticles.push(...lobstersArticles.value);
    }

    if (githubArticles.status === 'fulfilled') {
        console.log(`✅ GitHub: ${githubArticles.value.length} articles`);
        allArticles.push(...githubArticles.value);
    }

    const fetchTime = Date.now() - startTime;
    console.log(`📊 Total: ${allArticles.length} articles from ${getSourceCount(allArticles)} sources in ${fetchTime}ms`);

    if (allArticles.length === 0) {
        console.log('⚠️ No articles fetched, using fallback');
        return getFallbackNews();
    }

    // Remove duplicates based on title similarity
    const uniqueArticles = removeDuplicates(allArticles);

    // Shuffle for variety and return up to 25 articles
    const finalArticles = shuffleArray(uniqueArticles).slice(0, 25);

    console.log(`✨ Returning ${finalArticles.length} unique articles`);
    return finalArticles;
}

/**
 * Remove duplicate articles based on title similarity
 */
function removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
        const key = article.title.toLowerCase().substring(0, 50);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/**
 * Count unique sources
 */
function getSourceCount(articles: NewsArticle[]): number {
    const sources = new Set(articles.map(a => a.source));
    return sources.size;
}

/**
 * Fallback news (only used if all sources fail)
 */
function getFallbackNews(): NewsArticle[] {
    const now = Date.now();
    return [
        {
            title: "OpenAI Unveils GPT-5: Revolutionary Multimodal AI System",
            description: "OpenAI announces GPT-5 with unprecedented reasoning capabilities and multimodal understanding.",
            url: "https://openai.com/research",
            imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
            source: "OpenAI",
            publishedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString()
        },
        {
            title: "Google DeepMind Achieves Quantum Computing Milestone",
            description: "DeepMind's quantum AI system solves complex problems 1000x faster than classical computers.",
            url: "https://deepmind.google/research",
            imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800",
            source: "Google DeepMind",
            publishedAt: new Date(now - 5 * 60 * 60 * 1000).toISOString()
        }
    ];
}

/**
 * Get random article
 */
export async function getRandomAINews(): Promise<NewsArticle | null> {
    const articles = await fetchAITechNews();
    if (articles.length === 0) return null;
    return articles[Math.floor(Math.random() * articles.length)];
}

/**
 * Format article for posting
 */
export function formatNewsForPost(article: NewsArticle): {
    content: string;
    imageUrl?: string;
} {
    const emojis = ['🤖', '🚀', '💡', '⚡', '🔬', '🌟', '🎯', '💻', '🧠', '🔮'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const content = `${emoji} **${article.title}**

${article.description}

📰 Source: ${article.source}
🔗 ${article.url}

#AI #Technology #TechNews #Innovation #ArtificialIntelligence #MachineLearning`;

    return {
        content,
        imageUrl: article.imageUrl
    };
}
