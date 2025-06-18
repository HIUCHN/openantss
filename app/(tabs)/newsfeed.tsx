import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Plus, Calendar, Paperclip, Hash, Heart, MessageCircle, Repeat, Mail, MoveHorizontal as MoreHorizontal, Briefcase } from 'lucide-react-native';
import SearchBar from '@/components/SearchBar';
import AccountSettingsModal from '@/components/AccountSettingsModal';
import ContinuousTextInput from '@/components/ContinuousTextInput';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  avatar: string;
}

interface Post {
  id: number;
  author: {
    name: string;
    role: string;
    company: string;
    image: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  shares: number;
  tags: string[];
  type: 'text' | 'job' | 'poll' | 'image';
  liked: boolean;
  jobTitle?: string;
  poll?: {
    options: Array<{ name: string; percentage: number; color: string }>;
    totalVotes: number;
    timeLeft: string;
  };
  image?: string;
}

const initialPosts: Post[] = [
  {
    id: 1,
    author: {
      name: 'Alex Chen',
      role: 'Senior Product Designer',
      company: 'Spotify',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    content: 'Just wrapped up an amazing user research session! The insights we gathered will completely reshape our onboarding flow. Sometimes the best solutions come from simply listening to your users 🎯',
    timestamp: '2h ago',
    likes: 24,
    likedBy: ['Sarah Williams', 'Mike Johnson', 'Lisa Park'],
    comments: [
      {
        id: 1,
        author: 'Sarah Williams',
        content: 'This is so true! User research is often undervalued but it\'s the foundation of great design.',
        timestamp: '1h ago',
        avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400'
      },
      {
        id: 2,
        author: 'Mike Johnson',
        content: 'Would love to hear more about your research methodology. Any insights you can share?',
        timestamp: '45m ago',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    ],
    shares: 3,
    tags: ['#UXDesign', '#UserResearch'],
    type: 'text',
    liked: false,
  },
  {
    id: 2,
    author: {
      name: 'Sarah Williams',
      role: 'Engineering Manager',
      company: 'Airbnb',
      image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    content: 'Join our amazing team building the future of travel tech. React, TypeScript, and passion for great UX required!',
    timestamp: '4h ago',
    likes: 47,
    likedBy: ['Alex Chen', 'David Lee', 'Emma Rodriguez'],
    comments: [
      {
        id: 3,
        author: 'David Lee',
        content: 'This sounds like an amazing opportunity! Is this position remote-friendly?',
        timestamp: '3h ago',
        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    ],
    shares: 15,
    tags: ['#TechJobs', '#React', '#Remote'],
    type: 'job',
    jobTitle: 'Senior Frontend Developer - Remote',
    liked: false,
  },
  {
    id: 3,
    author: {
      name: 'Mike Johnson',
      role: 'Product Manager',
      company: 'Tesla',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    content: 'What\'s your go-to tool for wireframing? Curious to see what the community prefers!',
    timestamp: '6h ago',
    likes: 32,
    likedBy: ['Lisa Park', 'Emma Rodriguez'],
    comments: [
      {
        id: 4,
        author: 'Lisa Park',
        content: 'Figma all the way! The collaboration features are unmatched.',
        timestamp: '5h ago',
        avatar: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=400'
      },
      {
        id: 5,
        author: 'Emma Rodriguez',
        content: 'I still love Sketch for quick wireframes, but Figma is great for team collaboration.',
        timestamp: '4h ago',
        avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    ],
    shares: 7,
    tags: ['#ProductDesign', '#Tools'],
    type: 'poll',
    poll: {
      options: [
        { name: 'Figma', percentage: 45, color: '#6366F1' },
        { name: 'Sketch', percentage: 30, color: '#F59E0B' },
        { name: 'Adobe XD', percentage: 25, color: '#10B981' },
      ],
      totalVotes: 127,
      timeLeft: '2 days left',
    },
    liked: false,
  },
  {
    id: 4,
    author: {
      name: 'Lisa Park',
      role: 'Data Scientist',
      company: 'Google',
      image: 'https://images.pexels.com/photos/1239288/pexels-photo-1239288.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    content: 'Excited to share our latest machine learning project! This visualization shows user behavior patterns across different touchpoints. The insights are incredible! 📊✨',
    timestamp: '1d ago',
    likes: 89,
    likedBy: ['Alex Chen', 'Sarah Williams', 'Mike Johnson', 'David Lee'],
    comments: [
      {
        id: 6,
        author: 'Alex Chen',
        content: 'This visualization is stunning! What tools did you use for the data analysis?',
        timestamp: '20h ago',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
    ],
    shares: 12,
    tags: ['#MachineLearning', '#DataScience', '#Analytics'],
    type: 'image',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
    liked: false,
  },
];

const trendingTags = [
  { name: '#UXDesign', color: '#3B82F6' },
  { name: '#RemoteWork', color: '#10B981' },
  { name: '#TechJobs', color: '#8B5CF6' },
  { name: '#Startup', color: '#F59E0B' },
];

export default function NewsfeedScreen() {
  const { profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(initialPosts);
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredPosts(posts);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    
    const results = posts.filter(post => 
      post.author.name.toLowerCase().includes(lowercaseQuery) ||
      post.author.role.toLowerCase().includes(lowercaseQuery) ||
      post.author.company.toLowerCase().includes(lowercaseQuery) ||
      post.content.toLowerCase().includes(lowercaseQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      (post.type === 'job' && post.jobTitle?.toLowerCase().includes(lowercaseQuery)) ||
      post.comments.some(comment => 
        comment.author.toLowerCase().includes(lowercaseQuery) ||
        comment.content.toLowerCase().includes(lowercaseQuery)
      )
    );
    
    setFilteredPosts(results);
  };

  const handleCreatePost = (text: string) => {
    if (!text.trim()) {
      Alert.alert('Error', 'Please write something before posting.');
      return;
    }

    // Extract hashtags from the post content
    const hashtagRegex = /#\w+/g;
    const extractedTags = text.match(hashtagRegex) || [];

    // Create new post
    const newPost: Post = {
      id: Date.now(), // Simple ID generation
      author: {
        name: profile?.full_name || 'You',
        role: profile?.role || 'Professional',
        company: profile?.company || 'OpenAnts',
        image: profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      },
      content: text,
      timestamp: 'now',
      likes: 0,
      likedBy: [],
      comments: [],
      shares: 0,
      tags: extractedTags,
      type: 'text',
      liked: false,
    };

    // Add the new post to the beginning of the posts array
    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);
    
    // Update filtered posts if no search is active
    if (searchQuery.trim() === '') {
      setFilteredPosts(updatedPosts);
    } else {
      // Re-apply search filter with new posts
      const lowercaseQuery = searchQuery.toLowerCase();
      const results = updatedPosts.filter(post => 
        post.author.name.toLowerCase().includes(lowercaseQuery) ||
        post.author.role.toLowerCase().includes(lowercaseQuery) ||
        post.author.company.toLowerCase().includes(lowercaseQuery) ||
        post.content.toLowerCase().includes(lowercaseQuery) ||
        post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
        (post.type === 'job' && post.jobTitle?.toLowerCase().includes(lowercaseQuery)) ||
        post.comments.some(comment => 
          comment.author.toLowerCase().includes(lowercaseQuery) ||
          comment.content.toLowerCase().includes(lowercaseQuery)
        )
      );
      setFilteredPosts(results);
    }

    // Show success message
    Alert.alert('Success', 'Your post has been published!');
  };

  const handleLike = (postId: number) => {
    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post => {
        if (post.id === postId) {
          const isLiked = post.liked;
          return {
            ...post,
            liked: !isLiked,
            likes: isLiked ? post.likes - 1 : post.likes + 1,
            likedBy: isLiked 
              ? post.likedBy.filter(name => name !== 'You')
              : [...post.likedBy, 'You']
          };
        }
        return post;
      });
      
      // Update filtered posts as well
      if (searchQuery.trim() !== '') {
        setFilteredPosts(updatedPosts.filter(post => 
          post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.type === 'job' && post.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          post.comments.some(comment => 
            comment.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            comment.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
        ));
      } else {
        setFilteredPosts(updatedPosts);
      }
      
      return updatedPosts;
    });
  };

  const handleAddComment = (postId: number, commentText: string) => {
    if (!commentText.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now(),
      author: 'You',
      content: commentText,
      timestamp: 'now',
      avatar: profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400'
    };

    setPosts(prevPosts => {
      const updatedPosts = prevPosts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newCommentObj]
          };
        }
        return post;
      });
      
      // Update filtered posts as well
      if (searchQuery.trim() !== '') {
        setFilteredPosts(updatedPosts.filter(post => 
          post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (post.type === 'job' && post.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          post.comments.some(comment => 
            comment.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            comment.content.toLowerCase().includes(searchQuery.toLowerCase())
          )
        ));
      } else {
        setFilteredPosts(updatedPosts);
      }
      
      return updatedPosts;
    });
  };

  const toggleComments = (postId: number) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleProfilePress = () => {
    setShowAccountSettings(true);
  };

  const CreatePostSection = () => (
    <View style={styles.createPostSection}>
      <View style={styles.createPostContainer}>
        <Image 
          source={{ 
            uri: profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' 
          }} 
          style={styles.userAvatar} 
        />
        <View style={styles.createPostInput}>
          <ContinuousTextInput
            placeholder="Share a thought, update, question, or project..."
            onSave={handleCreatePost}
            maxLength={500}
            showWordCount={false}
            minHeight={80}
            maxHeight={200}
          />
          <View style={styles.createPostActions}>
            <View style={styles.postOptions}>
              <TouchableOpacity style={styles.postOption}>
                <Paperclip size={16} color="#6B7280" />
                <Text style={styles.postOptionText}>Attach</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postOption}>
                <Hash size={16} color="#6B7280" />
                <Text style={styles.postOptionText}>Tags</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postOption}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.postOptionText}>Event</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const TrendingSection = () => (
    <View style={styles.trendingSection}>
      <View style={styles.trendingContainer}>
        <Text style={styles.trendingLabel}>Trending:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trendingTags}>
          {trendingTags.map((tag, index) => (
            <TouchableOpacity key={index} style={[styles.trendingTag, { backgroundColor: `${tag.color}20` }]}>
              <Text style={[styles.trendingTagText, { color: tag.color }]}>{tag.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const CommentSection = ({ post }: { post: Post }) => (
    <View style={styles.commentsSection}>
      {post.comments.map((comment) => (
        <View key={comment.id} style={styles.commentItem}>
          <Image source={{ uri: comment.avatar }} style={styles.commentAvatar} />
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.author}</Text>
              <Text style={styles.commentTimestamp}>{comment.timestamp}</Text>
            </View>
            <Text style={styles.commentText}>{comment.content}</Text>
          </View>
        </View>
      ))}
      
      <View style={styles.addCommentSection}>
        <Image 
          source={{ 
            uri: profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' 
          }} 
          style={styles.commentAvatar} 
        />
        <View style={styles.addCommentInput}>
          <ContinuousTextInput
            placeholder="Write a comment..."
            onSave={(text) => handleAddComment(post.id, text)}
            maxLength={300}
            showWordCount={false}
            minHeight={40}
            maxHeight={100}
            multiline={true}
          />
        </View>
      </View>
    </View>
  );

  const PostCard = ({ post }: { post: Post }) => {
    const renderPostContent = () => {
      switch (post.type) {
        case 'job':
          return (
            <View style={styles.jobPostContainer}>
              <View style={styles.jobHeader}>
                <Briefcase size={16} color="#6366F1" />
                <Text style={styles.jobBadge}>We're Hiring!</Text>
              </View>
              <Text style={styles.jobTitle}>{post.jobTitle}</Text>
              <Text style={styles.jobDescription}>{post.content}</Text>
            </View>
          );
        
        case 'poll':
          return (
            <View>
              <Text style={styles.postContent}>{post.content}</Text>
              <View style={styles.pollContainer}>
                {post.poll!.options.map((option, index) => (
                  <TouchableOpacity key={index} style={styles.pollOption}>
                    <View style={styles.pollOptionHeader}>
                      <Text style={styles.pollOptionName}>{option.name}</Text>
                      <Text style={styles.pollOptionPercentage}>{option.percentage}%</Text>
                    </View>
                    <View style={styles.pollBar}>
                      <View 
                        style={[
                          styles.pollBarFill, 
                          { width: `${option.percentage}%`, backgroundColor: option.color }
                        ]} 
                      />
                    </View>
                  </TouchableOpacity>
                ))}
                <Text style={styles.pollMeta}>
                  {post.poll!.totalVotes} votes • {post.poll!.timeLeft}
                </Text>
              </View>
            </View>
          );
        
        case 'image':
          return (
            <View>
              <Text style={styles.postContent}>{post.content}</Text>
              <Image source={{ uri: post.image }} style={styles.postImage} />
            </View>
          );
        
        default:
          return <Text style={styles.postContent}>{post.content}</Text>;
      }
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Image source={{ uri: post.author.image }} style={styles.authorImage} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <Text style={styles.authorRole}>{post.author.role} at {post.author.company}</Text>
          </View>
          <View style={styles.postMeta}>
            <Text style={styles.timestamp}>{post.timestamp}</Text>
            <TouchableOpacity style={styles.moreButton}>
              <MoreHorizontal size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {renderPostContent()}

        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.postActions}>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleLike(post.id)}>
              <Heart 
                size={18} 
                color={post.liked ? "#EF4444" : "#6B7280"} 
                fill={post.liked ? "#EF4444" : "none"}
              />
              <Text style={[styles.actionText, post.liked && styles.likedText]}>{post.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => toggleComments(post.id)}>
              <MessageCircle size={18} color="#6B7280" />
              <Text style={styles.actionText}>{post.comments.length}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Repeat size={18} color="#6B7280" />
              <Text style={styles.actionText}>{post.shares}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.messageButton}>
            <Mail size={18} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {/* Likes Summary */}
        {post.likedBy.length > 0 && (
          <View style={styles.likesSummary}>
            <Text style={styles.likesSummaryText}>
              Liked by {post.likedBy.slice(0, 2).join(', ')}
              {post.likedBy.length > 2 && ` and ${post.likedBy.length - 2} others`}
            </Text>
          </View>
        )}

        {/* Comments Section */}
        {showComments[post.id] && <CommentSection post={post} />}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.appIcon}>
              <Image 
                source={require('@/assets/images/OpenAnts logo copy.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.headerTitle}>Newsfeed</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={20} color="#6B7280" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleProfilePress}>
              <Image 
                source={{ 
                  uri: profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400' 
                }} 
                style={styles.profileImage} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <SearchBar
        placeholder="Search posts, people, companies, tags..."
        onSearch={handleSearch}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create Post Section - Hide when searching */}
        {searchQuery.trim() === '' && <CreatePostSection />}
        
        {/* Trending Section - Hide when searching */}
        {searchQuery.trim() === '' && <TrendingSection />}
        
        {/* Search Results Header */}
        {searchQuery.trim() !== '' && (
          <View style={styles.searchResults}>
            <Text style={styles.searchResultsTitle}>
              Search Results for "{searchQuery}"
            </Text>
            {filteredPosts.length === 0 && (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>No posts found</Text>
                <Text style={styles.noResultsSubtext}>Try adjusting your search terms</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Posts Feed */}
        <View style={styles.feedSection}>
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Account Settings Modal */}
      <AccountSettingsModal 
        visible={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  searchResults: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 8,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  noResultsSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
  },
  createPostSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  createPostContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  createPostInput: {
    flex: 1,
  },
  createPostActions: {
    marginTop: 12,
  },
  postOptions: {
    flexDirection: 'row',
    gap: 16,
  },
  postOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  trendingSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  trendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  trendingLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  trendingTags: {
    flex: 1,
  },
  trendingTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
  },
  trendingTagText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  feedSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 2,
  },
  authorRole: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  postMeta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  moreButton: {
    padding: 4,
  },
  postContent: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 22,
    marginBottom: 12,
  },
  jobPostContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobBadge: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6366F1',
    marginLeft: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginBottom: 4,
  },
  jobDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  pollContainer: {
    marginTop: 16,
  },
  pollOption: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pollOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollOptionName: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#111827',
  },
  pollOptionPercentage: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  pollBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  pollBarFill: {
    height: 6,
    borderRadius: 3,
  },
  pollMeta: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 8,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  likedText: {
    color: '#EF4444',
  },
  messageButton: {
    padding: 8,
  },
  likesSummary: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
  },
  likesSummaryText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  commentsSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#111827',
    marginRight: 8,
  },
  commentTimestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  commentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 18,
  },
  addCommentSection: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  addCommentInput: {
    flex: 1,
    marginLeft: 8,
  },
  bottomPadding: {
    height: 100,
  },
});