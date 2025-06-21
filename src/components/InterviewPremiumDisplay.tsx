
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, MessageSquare, Lightbulb, CheckCircle, Star, Target, Users, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InterviewPremiumDisplayProps {
  interviewData: string;
}

interface ParsedQuestion {
  number: number;
  question: string;
  answer: string;
  proTip?: string;
}

export const InterviewPremiumDisplay: React.FC<InterviewPremiumDisplayProps> = ({ interviewData }) => {
  const { toast } = useToast();

  const parseInterviewData = (data: string): { title: string; strategy: string; questions: ParsedQuestion[] } => {
    console.log('Parsing interview data:', data);
    
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let title = '';
    let strategy = '';
    const questions: ParsedQuestion[] = [];
    let currentSection = 'title';
    let currentQuestion: Partial<ParsedQuestion> = {};
    
    for (const line of lines) {
      // Extract title
      if (line.startsWith('# ')) {
        title = line.replace('# ', '');
        continue;
      }
      
      // Strategy section
      if (line.includes('Interview Approach Strategy') || line.includes('Approaching this')) {
        currentSection = 'strategy';
        continue;
      }
      
      // Question detection
      if (line.startsWith('**Question ') && line.includes(':**')) {
        if (currentQuestion.question) {
          questions.push(currentQuestion as ParsedQuestion);
        }
        const questionMatch = line.match(/\*\*Question (\d+): (.+?)\*\*/);
        if (questionMatch) {
          currentQuestion = {
            number: parseInt(questionMatch[1]),
            question: questionMatch[2]
          };
        }
        currentSection = 'question';
        continue;
      }
      
      // Answer detection
      if (line.startsWith('**Your Answer:**')) {
        currentSection = 'answer';
        continue;
      }
      
      // Pro tip detection
      if (line.startsWith('**Pro Tip:**')) {
        currentSection = 'protip';
        continue;
      }
      
      // Content accumulation
      if (currentSection === 'strategy' && !line.startsWith('---') && !line.startsWith('**Question')) {
        strategy += (strategy ? ' ' : '') + line;
      } else if (currentSection === 'answer' && currentQuestion.question && !line.startsWith('**Pro Tip:**') && !line.startsWith('---')) {
        currentQuestion.answer = (currentQuestion.answer || '') + (currentQuestion.answer ? ' ' : '') + line;
      } else if (currentSection === 'protip' && !line.startsWith('---') && !line.startsWith('**Question')) {
        currentQuestion.proTip = (currentQuestion.proTip || '') + (currentQuestion.proTip ? ' ' : '') + line;
      }
    }
    
    // Add the last question
    if (currentQuestion.question) {
      questions.push(currentQuestion as ParsedQuestion);
    }
    
    console.log('Parsed data:', { title, strategy, questions });
    return { title, strategy, questions };
  };

  const { title, strategy, questions } = parseInterviewData(interviewData);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`
    });
  };

  const getQuestionIcon = (index: number) => {
    const icons = [MessageSquare, Users, Brain, Target, Star, CheckCircle, Lightbulb];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="w-full space-y-6 bg-gradient-to-br from-gray-900 to-teal-900/20 min-h-screen p-4 rounded-xl">
      {/* Header Section */}
      <div className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl shadow-2xl border border-teal-500/30 overflow-hidden">
        <div className="p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">
                {title || 'Interview Preparation Guide'}
              </h1>
              <p className="text-teal-100 mt-1">AI-powered interview strategy and personalized questions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>Interview prep complete • {questions.length} questions generated</span>
          </div>
        </div>
      </div>

      {/* Strategy Section */}
      {strategy && (
        <Card className="bg-gradient-to-r from-teal-800/50 to-emerald-800/50 border border-teal-500/30 shadow-2xl rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Target className="w-5 h-5" />
                </div>
                Strategic Approach
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(strategy, 'Interview strategy')}
                className="text-white hover:bg-white/20"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-teal-50/10 to-emerald-50/10 rounded-xl p-4 border-l-4 border-teal-500">
              <p className="text-gray-200 leading-relaxed text-sm">
                {strategy}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Interview Questions & Perfect Answers</h2>
        </div>

        {questions.map((item, index) => (
          <Card key={index} className="bg-gradient-to-r from-teal-800/30 to-emerald-800/30 border border-teal-500/30 shadow-2xl rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    {getQuestionIcon(index)}
                  </div>
                  <div>
                    <span className="text-teal-100 text-sm">Question {item.number}</span>
                    <h3 className="text-lg font-medium mt-1">{item.question}</h3>
                  </div>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(`Q: ${item.question}\nA: ${item.answer}${item.proTip ? `\nTip: ${item.proTip}` : ''}`, `Question ${item.number}`)}
                  className="text-white hover:bg-white/20"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {/* Answer */}
              <div className="bg-gradient-to-r from-teal-50/10 to-emerald-50/10 rounded-xl p-4 border-l-4 border-teal-500">
                <h4 className="font-bold text-teal-300 text-sm mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Your Perfect Answer
                </h4>
                <p className="text-gray-200 leading-relaxed text-sm">
                  {item.answer}
                </p>
              </div>

              {/* Pro Tip */}
              {item.proTip && (
                <div className="bg-gradient-to-r from-emerald-50/10 to-yellow-50/10 rounded-xl p-4 border-l-4 border-emerald-500">
                  <h4 className="font-bold text-emerald-300 text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Pro Interview Tip
                  </h4>
                  <p className="text-gray-200 leading-relaxed text-sm">
                    {item.proTip}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-6">
        <Button
          onClick={() => copyToClipboard(interviewData, 'Complete interview guide')}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white px-8 py-3 text-lg font-semibold shadow-xl"
        >
          <Copy className="w-5 h-5 mr-3" />
          Copy Complete Interview Guide
        </Button>
      </div>
    </div>
  );
};
