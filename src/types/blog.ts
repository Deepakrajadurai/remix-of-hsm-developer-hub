export interface Blog {
    id: string;
    title: string;
    content: string;
    cover_image_url?: string;
    author_id: string;
    author_name: string;
    author_avatar?: string;
    created_at: string;
    updated_at: string;
    published?: boolean;
}
