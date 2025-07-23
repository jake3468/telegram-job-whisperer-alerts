import { useAIInterviewCredits } from '@/hooks/useAIInterviewCredits';
import { Phone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
interface AIInterviewCreditsDisplayProps {
  onBuyMore?: () => void;
}
export const AIInterviewCreditsDisplay = ({
  onBuyMore
}: AIInterviewCreditsDisplayProps) => {
  const {
    credits,
    isLoading,
    error,
    refetch,
    remainingCredits
  } = useAIInterviewCredits();
  if (isLoading) {
    return <Card className="p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Loading calls...
        </div>
      </Card>;
  }

  // Show error state with better messaging and retry option
  if (error) {
    // Log only error type, not full error details
    return <Card className="p-4 border-destructive/20 bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
              <Phone className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <div className="font-semibold text-lg text-destructive">
                Unable to load calls
              </div>
              <div className="text-sm text-destructive/80">
                {error.includes('Failed to load') ? 'Connection issue' : 'Please try refreshing'}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 w-8 p-0" title="Refresh call data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>;
  }

  // Show setup UI when initializing
  if (!credits) {
    return <Card className="p-4 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-lg">
                Setting up calls...
              </div>
              <div className="text-sm text-muted-foreground">
                Initializing your free calls
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 w-8 p-0" title="Refresh call data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>;
  }
  return <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/15 to-accent/10 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-lg">
              {remainingCredits} Call{remainingCredits !== 1 ? 's' : ''} Left
            </div>
            <div className="text-sm text-muted-foreground">
              Used {credits.used_credits} of {credits.total_credits} total calls
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 w-8 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          {remainingCredits === 0 && onBuyMore && <Button onClick={onBuyMore} size="sm" className="bg-primary hover:bg-primary/90">
              Buy More
            </Button>}
        </div>
      </div>
      
      {remainingCredits > 0 && <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Calls remaining</span>
            <span>{remainingCredits}/{credits.total_credits}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{
          width: `${remainingCredits / credits.total_credits * 100}%`
        }} />
          </div>
        </div>}
      
      {remainingCredits === 0 && <div className="mt-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
          <p className="text-sm text-destructive font-medium">
            No interview calls remaining
          </p>
          <p className="text-xs text-destructive/80 mt-1">
            Purchase more calls to continue using AI mock interviews
          </p>
        </div>}
    </Card>;
};