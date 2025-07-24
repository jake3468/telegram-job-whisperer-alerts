
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Edit3 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEnhancedTokenManagerIntegration } from '@/hooks/useEnhancedTokenManagerIntegration';
import { useEnterpriseAPIClient } from '@/hooks/useEnterpriseAPIClient';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  bio: string | null;
  user_id: string;
  resume: string | null;
  created_at: string;
}

export const BioSection = () => {
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialBio, setInitialBio] = useState(''); // Track initial value

  const { toast } = useToast();
  const sessionManager = useEnhancedTokenManagerIntegration();
  const { makeAuthenticatedRequest } = useEnterpriseAPIClient();

  // Load bio data on component mount
  useEffect(() => {
    const loadBioData = async () => {
      if (!sessionManager) {
        return;
      }
      setIsLoading(true);

      try {
        const result = await makeAuthenticatedRequest(async () => {
          const { data, error } = await supabase
            .from('user_profile')
            .select('*')
            .single();

          if (error) {
            console.error('[BioSection] Error fetching user profile:', error);
            throw error;
          }

          
          return data;
        });

        if (result) {
          const userBio = result.bio || '';
          setBio(userBio);
          setInitialBio(userBio);
        }
      } catch (error) {
        console.error('[BioSection] Error loading bio:', error);
        toast({
          title: "Error loading bio",
          description: "Please try refreshing the page",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBioData();
  }, [sessionManager, makeAuthenticatedRequest, toast]);

  // Track changes to the bio
  useEffect(() => {
    setHasChanges(bio !== initialBio);
  }, [bio, initialBio]);

  // Update activity when user interacts
  const handleBioChange = (value: string) => {
    setBio(value);
    if (sessionManager) {
      sessionManager.updateActivity();
    }
  };

  const handleSave = async () => {
    if (!sessionManager) {
      toast({
        title: "Authentication required",
        description: "Please refresh the page and try again",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    sessionManager.updateActivity();

    try {
      await makeAuthenticatedRequest(async () => {
        const { error } = await supabase
          .from('user_profile')
          .update({ bio: bio.trim() })
          .single();

        if (error) {
          console.error('[BioSection] Error saving bio:', error);
          throw error;
        }

        
      });

      setInitialBio(bio);
      setHasChanges(false);
      setIsEditing(false);

      toast({
        title: "Bio saved successfully",
        description: "Your bio has been updated",
      });
    } catch (error) {
      console.error('[BioSection] Save error:', error);
      toast({
        title: "Save failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (sessionManager) {
      sessionManager.updateActivity();
    }
  };

  const handleCancel = () => {
    setBio(initialBio);
    setIsEditing(false);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Bio...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Professional Bio
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <>
            <Textarea
              value={bio}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="Tell us about your professional background, skills, and career goals..."
              className="min-h-32 resize-none"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {bio.length}/1000 characters
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Bio'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {bio ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {bio}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm italic">
                No bio added yet. Click "Edit" to add your professional bio.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
