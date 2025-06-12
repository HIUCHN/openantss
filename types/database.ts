export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          full_name: string | null;
          role: string | null;
          company: string | null;
          bio: string | null;
          avatar_url: string | null;
          location: string | null;
          skills: string[] | null;
          interests: string[] | null;
          looking_for: string[] | null;
          is_public: boolean;
          proximity_alerts: boolean;
          direct_messages: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          full_name?: string | null;
          role?: string | null;
          company?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          skills?: string[] | null;
          interests?: string[] | null;
          looking_for?: string[] | null;
          is_public?: boolean;
          proximity_alerts?: boolean;
          direct_messages?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          full_name?: string | null;
          role?: string | null;
          company?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          skills?: string[] | null;
          interests?: string[] | null;
          looking_for?: string[] | null;
          is_public?: boolean;
          proximity_alerts?: boolean;
          direct_messages?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      connection_requests: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          status: 'pending' | 'accepted' | 'declined';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          message: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          message?: string;
          status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
          updated_at?: string;
        };
      };
      connections: {
        Row: {
          id: string;
          user1_id: string;
          user2_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user1_id: string;
          user2_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user1_id?: string;
          user2_id?: string;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          type: 'text' | 'job' | 'poll' | 'image';
          job_title: string | null;
          poll_options: any | null;
          image_url: string | null;
          tags: string[] | null;
          likes_count: number;
          comments_count: number;
          shares_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          type?: 'text' | 'job' | 'poll' | 'image';
          job_title?: string | null;
          poll_options?: any | null;
          image_url?: string | null;
          tags?: string[] | null;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          content?: string;
          type?: 'text' | 'job' | 'poll' | 'image';
          job_title?: string | null;
          poll_options?: any | null;
          image_url?: string | null;
          tags?: string[] | null;
          likes_count?: number;
          comments_count?: number;
          shares_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_education: {
        Row: {
          id: string;
          user_id: string;
          school: string;
          degree: string;
          start_year: string;
          end_year: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          school: string;
          degree: string;
          start_year: string;
          end_year: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          school?: string;
          degree?: string;
          start_year?: string;
          end_year?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}