
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, MessageSquare, Lightbulb, CheckCircle, Star, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PremiumInterviewDisplayProps {
  interviewData: string;
}

interface ParsedQuestion {
  number: number;
  question: string;
  answer: string;
  proTip?: string;
}

export const PremiumInterviewDisplay: React.FC<PremiumInterviewDisplayProps> = ({ interviewData }) => {
  const { toast } = useToast();

  const parseInterviewData = (data: string): { title: string; strategy: string; questions: ParsedQuestion[] } => {
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
    const icons = [MessageSquare, Target, Star, CheckCircle, Lightbulb];
    const IconComponent = icons[index % icons.length];
    return <IconComponent className="w-5 h-5" />;
  };

  return (
    <div className="w-full space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen p-4">
      {/* Header Section */}
      <div className="w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">
                {title || 'Interview Preparation Guide'}
              </h1>
              <p className="text-blue-100 mt-1">Personalized interview strategy and questions</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-300" />
            <span>Interview prep complete - {questions.length} questions generated</span>
          </div>
        </div>
      </div>

      {/* Strategy Section */}
      {strategy && (
        <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Target className="w-5 h-5" />
                </div>
                Interview Strategy
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
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border-l-4 border-orange-500">
              <p className="text-gray-700 leading-relaxed text-sm">
                {strategy}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Interview Questions & Answers</h2>
        </div>

        {questions.map((item, index) => (
          <Card key={index} className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    {getQuestionIcon(index)}
                  </div>
                  <div>
                    <span className="text-blue-100 text-sm">Question {item.number}</span>
                    <h3 className="text-lg font-medium">{item.question}</h3>
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
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-l-4 border-blue-500">
                <h4 className="font-bold text-blue-800 text-sm mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Your Answer
                </h4>
                <p className="text-gray-700 leading-relaxed text-sm">
                  {item.answer}
                </p>
              </div>

              {/* Pro Tip */}
              {item.proTip && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-l-4 border-yellow-500">
                  <h4 className="font-bold text-yellow-800 text-sm mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Pro Tip
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-sm">
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
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Complete Guide
        </Button>
      </div>
    </div>
  );
};
