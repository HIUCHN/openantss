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
          latitude: number | null;
          longitude: number | null;
          last_location_update: string | null;
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
          latitude?: number | null;
          longitude?: number | null;
          last_location_update?: string | null;
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
          latitude?: number | null;
          longitude?: number | null;
          last_location_update?: string | null;
        };
      };
      user_location: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy: number | null;
          altitude: number | null;
          heading: number | null;
          speed: number | null;
          timestamp: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          accuracy?: number | null;
          altitude?: number | null;
          heading?: number | null;
          speed?: number | null;
          timestamp: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number;
          longitude?: number;
          accuracy?: number | null;
          altitude?: number | null;
          heading?: number | null;
          speed?: number | null;
          timestamp?: string;
          is_active?: boolean;
          created_at?: string;
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
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_comment_id: string | null;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          content: string;
          parent_comment_id?: string | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          content?: string;
          parent_comment_id?: string | null;
          likes_count?: number;
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
        };
        Insert: {
          id?: string;
          user_id: string;
          school: string;
          degree: string;
          start_year: string;
          end_year: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          school?: string;
          degree?: string;
          start_year?: string;
          end_year?: string;
          created_at?: string;
        };
      };
      experiences: {
        Row: {
          id: string;
          user_id: string;
          job_title: string;
          company: string;
          duration: string;
          description: string;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_title: string;
          company: string;
          duration: string;
          description: string;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_title?: string;
          company?: string;
          duration?: string;
          description?: string;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          years_experience: number | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          years_experience?: number | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
          years_experience?: number | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      name_change_history: {
        Row: {
          id: string;
          user_id: string;
          previous_name: string;
          new_name: string;
          changed_at: string;
          reason: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          previous_name: string;
          new_name: string;
          changed_at?: string;
          reason?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          previous_name?: string;
          new_name?: string;
          changed_at?: string;
          reason?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      update_user_name: {
        Args: {
          new_full_name: string;
          change_reason?: string | null;
        };
        Returns: {
          success: boolean;
          message: string;
          previous_name?: string;
          new_name?: string;
        };
      };
      get_user_conversations: {
        Args: {
          user_id: string;
        };
        Returns: {
          conversation_partner_id: string;
          conversation_partner_name: string;
          conversation_partner_avatar: string;
          conversation_partner_role: string;
          last_message_content: string;
          last_message_time: string;
          unread_count: number;
          is_online: boolean;
        }[];
      };
      get_conversation_messages: {
        Args: {
          user1_id: string;
          user2_id: string;
        };
        Returns: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
          sender_name: string;
          sender_avatar: string;
        }[];
      };
      increment_post_likes: {
        Args: {
          post_id: string;
        };
        Returns: void;
      };
      decrement_post_likes: {
        Args: {
          post_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}