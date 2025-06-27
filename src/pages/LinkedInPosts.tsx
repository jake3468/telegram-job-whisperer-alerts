
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Image as ImageIcon, Upload, X, Loader2, TrendingUp, Users, Share2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCreditCheck } from '@/hooks/useCreditCheck';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import LoadingMessages from '@/components/LoadingMessages';
import { useUser } from '@clerk/clerk-react';
import { useClerkSupabaseSync } from '@/hooks/useClerkSupabaseSync';
import { LinkedInPostsHistoryModal } from '@/components/LinkedInPostsHistoryModal';
import { LinkedInPostDisplay } from '@/components/LinkedInPostDisplay';
import { useLinkedInImageCreditCheck } from '@/hooks/useLinkedInImageCreditCheck';
import { ProfileCompletionWarning } from '@/components/ProfileCompletionWarning';

const LinkedInPosts = () => {
  // Ensure Clerk JWT is synced with Supabase
  useClerkSupabaseSync();
  
  const { user } = useUser();
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState('personal_branding');
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const [linkedInPostData, setLinkedInPostData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { hasCredits, showInsufficientCreditsPopup } = useCreditCheck(1.0);
  const { userProfile } = useUserProfile();
  const { checkImageCredits, showImageCreditPopup } = useLinkedInImageCreditCheck();

  // Query for existing LinkedIn posts data
  const { data: linkedInHistory, refetch: refetchHistory } = useQuery({
    queryKey: ['linkedin-posts-history', userProfile?.id],
    queryFn: async () => {
      if (!userProfile?.id) return [];
      
      const { data, error } = await supabase
        .from('linkedin_posts')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!userProfile?.id
  });

  // Real-time subscription for LinkedIn post results
  useEffect(() => {
    if (!currentAnalysis?.id) return;

    const channel = supabase
      .channel('linkedin-posts-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'linkedin_posts',
        filter: `id=eq.${currentAnalysis.id}`
      }, (payload) => {
        console.log('LinkedIn post updated:', payload);
        
        if (payload.new.post_variations) {
          try {
            const parsedData = typeof payload.new.post_variations === 'string' 
              ? JSON.parse(payload.new.post_variations)
              : payload.new.post_variations;
            
            if (parsedData && Object.keys(parsedData).length > 0) {
              setLinkedInPostData(parsedData);
              setIsGenerating(false);
              toast({
                title: "LinkedIn Posts Ready!",
                description: "Your personalized LinkedIn posts have been generated."
              });
            }
          } catch (error) {
            console.error('Error processing LinkedIn post variations:', error);
            setIsGenerating(false);
            toast({
              title: "Error Processing Results",
              description: "There was an error processing your LinkedIn post results.",
              variant: "destructive"
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAnalysis?.id, toast]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "Invalid File Type",
        description: "Please upload only image files (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Limit to 4 images maximum
    const newImages = [...uploadedImages, ...imageFiles].slice(0, 4);
    setUploadedImages(newImages);
    
    if (newImages.length > uploadedImages.length) {
      toast({
        title: "Images Added",
        description: `Added ${newImages.length - uploadedImages.length} image(s). Maximum 4 images allowed.`
      });
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    console.log('🚀 LinkedIn Posts Generate Button Clicked');
    
    // Check credits for text generation
    if (!hasCredits) {
      showInsufficientCreditsPopup();
      return;
    }

    // Check image credits if images are uploaded
    if (uploadedImages.length > 0) {
      const hasImageCredits = await checkImageCredits(uploadedImages.length);
      if (!hasImageCredits) {
        showImageCreditPopup(uploadedImages.length);
        return;
      }
    }

    if (!postContent.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide the content or topic for your LinkedIn post.",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to generate LinkedIn posts.",
        variant: "destructive"
      });
      return;
    }

    if (!userProfile?.id) {
      toast({
        title: "Profile Error",
        description: "User profile not found. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    if (isSubmitting || isGenerating) {
      toast({
        title: "Please wait",
        description: "Your LinkedIn posts are already being generated.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setLinkedInPostData(null);
      console.log('✅ Starting LinkedIn posts submission process');

      // Upload images first if any
      let imageUrls: string[] = [];
      if (uploadedImages.length > 0) {
        console.log('📸 Uploading images...');
        
        for (const image of uploadedImages) {
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${image.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('linkedin-images')
            .upload(fileName, image);
          
          if (uploadError) {
            console.error('Image upload error:', uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('linkedin-images')
            .getPublicUrl(fileName);
          
          imageUrls.push(publicUrl);
        }
        
        console.log('✅ Images uploaded successfully:', imageUrls);
      }

      // Insert new LinkedIn post record
      const insertData = {
        user_id: userProfile.id,
        post_content: postContent.trim(),
        post_type: postType,
        include_hashtags: includeHashtags,
        image_urls: imageUrls.length > 0 ? imageUrls : null
      };

      console.log('📝 Inserting LinkedIn post data:', insertData);
      
      const { data: insertedData, error: insertError } = await supabase
        .from('linkedin_posts')
        .insert(insertData)
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ INSERT ERROR:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (insertedData?.id) {
        console.log('✅ LinkedIn post record inserted:', insertedData.id);
        setCurrentAnalysis(insertedData);
        setIsGenerating(true);
        refetchHistory();
        
        toast({
          title: "LinkedIn Posts Started!",
          description: "Your personalized LinkedIn posts are being generated. Please wait for the results."
        });
      }
    } catch (error) {
      console.error('❌ SUBMISSION ERROR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate LinkedIn posts';
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPostContent('');
    setPostType('personal_branding');
    setIncludeHashtags(true);
    setUploadedImages([]);
    setLinkedInPostData(null);
    setCurrentAnalysis(null);
    setIsGenerating(false);
  };

  const postTypes = [
    { value: 'personal_branding', label: 'Personal Branding' },
    { value: 'industry_insights', label: 'Industry Insights' },
    { value: 'career_update', label: 'Career Update' },
    { value: 'thought_leadership', label: 'Thought Leadership' },
    { value: 'company_news', label: 'Company News' },
    { value: 'networking', label: 'Networking' }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 pb-2 max-w-5xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 px-2">
            <div className="inline-flex items-center gap-3 mb-4">
              {/* Icon removed as requested */}
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent font-extrabold sm:text-4xl text-4xl">
              💼 LinkedIn Posts
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-lg font-light px-4">
              Your Personal LinkedIn Content Creator, powered by AI. Generate engaging posts that boost your professional presence and drive meaningful connections.
            </p>
          </div>

          {/* Profile Completion Warning */}
          <ProfileCompletionWarning />

          {/* Form - Always visible */}
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-500 via-purple-600 to-blue-700 border-0 mx-2 sm:mx-0">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-white text-lg sm:text-xl">LinkedIn Post Details</CardTitle>
                <div className="flex-shrink-0">
                  <LinkedInPostsHistoryModal />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Post Content */}
              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Post Content or Topic
                </Label>
                <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Describe what you want to post about, share your thoughts, or provide a topic for AI to expand on..."
                  disabled={isGenerating || isSubmitting}
                  className="border-gray-300 placeholder-gray-400 min-h-32 bg-black text-white w-full resize-none"
                />
              </div>

              {/* Post Type and Hashtags in horizontal layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Post Type</Label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    disabled={isGenerating || isSubmitting}
                    className="w-full p-2 rounded border border-gray-300 bg-black text-white"
                  >
                    {postTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 flex flex-col justify-center">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hashtags"
                      checked={includeHashtags}
                      onCheckedChange={(checked) => setIncludeHashtags(checked as boolean)}
                      disabled={isGenerating || isSubmitting}
                    />
                    <Label htmlFor="hashtags" className="text-white font-medium">
                      Include Hashtags
                    </Label>
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Upload Images (optional) - Max 4 images
                </Label>
                <div className="border-2 border-dashed border-gray-400 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isGenerating || isSubmitting || uploadedImages.length >= 4}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer flex flex-col items-center gap-2 ${
                      uploadedImages.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-400 text-sm">
                      {uploadedImages.length >= 4 
                        ? 'Maximum 4 images reached' 
                        : 'Click to upload images or drag and drop'
                      }
                    </span>
                  </label>
                </div>

                {/* Display uploaded images */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded border border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          disabled={isGenerating || isSubmitting}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || isSubmitting}
                  className="w-full sm:flex-1 text-white font-medium bg-blue-600 hover:bg-blue-500"
                >
                  {isGenerating || isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate LinkedIn Posts'
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  disabled={isGenerating || isSubmitting}
                  className="w-full sm:w-auto px-6 border-white text-white hover:bg-white/10"
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isGenerating && (
            <div className="text-center py-8">
              <LoadingMessages type="linkedin_posts" />
            </div>
          )}

          {/* Results - Show below form when available */}
          {linkedInPostData && (
            <div className="w-full space-y-6">
              <LinkedInPostDisplay postData={linkedInPostData} />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default LinkedInPosts;
