import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, MessageSquare, Lightbulb, CheckCircle, Star, Target, Users, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InterviewPrepDownloadActions from '@/components/InterviewPrepDownloadActions';

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

  const parseInterviewData = (data: string): { title: string; strategy: string; questions: ParsedQuestion[]; companyName: string; jobTitle: string } => {
    console.log('Raw interview data received:', data);
    
    if (!data || typeof data !== 'string') {
      console.log('No valid data provided');
      return { title: '', strategy: '', questions: [], companyName: 'Company', jobTitle: 'Position' };
    }
    
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let title = '';
    let strategy = '';
    const questions: ParsedQuestion[] = [];
    let currentSection = 'title';
    let currentQuestion: Partial<ParsedQuestion> = {};
    
    // Extract company and job title from the data
    let companyName = 'Company';
    let jobTitle = 'Position';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Extract title
      if (line.startsWith('# ')) {
        title = line.replace('# ', '').trim();
        console.log('Found title:', title);
        
        // Try to extract company and job title from title
        const titleMatch = title.match(/(.+?)\s+at\s+(.+?)(?:\s+-|$)/i);
        if (titleMatch) {
          jobTitle = titleMatch[1].trim();
          companyName = titleMatch[2].trim();
        }
        continue;
      }
      
      // Strategy section detection
      if (line.toLowerCase().includes('strategy') || line.toLowerCase().includes('approach')) {
        currentSection = 'strategy';
        console.log('Entering strategy section at line:', i);
        continue;
      }
      
      // Question detection - more flexible patterns
      const questionPatterns = [
        /^\*\*Question\s+(\d+):\s*(.+?)\*\*$/i,
        /^Question\s+(\d+):\s*(.+)$/i,
        /^(\d+)\.\s*(.+)$/,
        /^\*\*(\d+)\.\s*(.+?)\*\*$/
      ];
      
      let questionMatch = null;
      for (const pattern of questionPatterns) {
        questionMatch = line.match(pattern);
        if (questionMatch) break;
      }
      
      if (questionMatch) {
        // Save previous question if exists
        if (currentQuestion.question && currentQuestion.answer) {
          questions.push(currentQuestion as ParsedQuestion);
          console.log('Added question:', currentQuestion.number);
        }
        
        currentQuestion = {
          number: parseInt(questionMatch[1]),
          question: questionMatch[2].trim()
        };
        currentSection = 'question';
        console.log('Found question:', currentQuestion.number, currentQuestion.question);
        continue;
      }
      
      // Answer detection
      if (line.toLowerCase().includes('answer') && line.includes('**')) {
        currentSection = 'answer';
        console.log('Entering answer section');
        continue;
      }
      
      // Pro tip detection
      if (line.toLowerCase().includes('pro tip') || line.toLowerCase().includes('tip')) {
        currentSection = 'protip';
        console.log('Entering pro tip section');
        continue;
      }
      
      // Content accumulation based on current section
      if (currentSection === 'strategy' && !line.startsWith('---') && !line.includes('Question')) {
        strategy += (strategy ? ' ' : '') + line;
      } else if (currentSection === 'answer' && currentQuestion.question) {
        if (!line.includes('**Pro Tip') && !line.includes('**Question') && !line.startsWith('---')) {
          currentQuestion.answer = (currentQuestion.answer || '') + (currentQuestion.answer ? ' ' : '') + line;
        }
      } else if (currentSection === 'protip') {
        if (!line.startsWith('---') && !line.includes('**Question')) {
          currentQuestion.proTip = (currentQuestion.proTip || '') + (currentQuestion.proTip ? ' ' : '') + line;
        }
      }
    }
    
    // Add the last question if it exists
    if (currentQuestion.question && currentQuestion.answer) {
      questions.push(currentQuestion as ParsedQuestion);
      console.log('Added final question:', currentQuestion.number);
    }
    
    console.log('Final parsed data:', { 
      title: title || 'Interview Preparation Guide', 
      strategy: strategy.substring(0, 100) + '...', 
      questionsCount: questions.length 
    });
    
    return { 
      title: title || 'Interview Preparation Guide', 
      strategy, 
      questions, 
      companyName, 
      jobTitle 
    };
  };

  const { title, strategy, questions, companyName, jobTitle } = parseInterviewData(interviewData);

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
        <div className="p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
                <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold leading-tight break-words">
                  {title}
                </h1>
                <p className="text-teal-100 mt-1 text-sm sm:text-base">AI-powered interview strategy and personalized questions</p>
              </div>
            </div>
            
            <div className="flex-shrink-0 w-full sm:w-auto">
              <InterviewPrepDownloadActions 
                interviewData={interviewData}
                jobTitle={jobTitle}
                companyName={companyName}
                contrast={true}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            <span className="break-words">Interview prep complete • {questions.length} questions generated</span>
          </div>
        </div>
      </div>

      {/* Strategy Section */}
      {strategy && (
        <Card className="bg-gradient-to-r from-teal-800/50 to-emerald-800/50 border border-teal-500/30 shadow-2xl rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-3 min-w-0 flex-1">
                <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <span className="break-words">Strategic Approach</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(strategy, 'Interview strategy')}
                className="text-white hover:bg-white/20 flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="bg-gradient-to-r from-teal-50/10 to-emerald-50/10 rounded-xl p-4 border-l-4 border-teal-500">
              <p className="text-gray-200 leading-relaxed text-sm break-words">
                {strategy}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white break-words">Interview Questions & Perfect Answers</h2>
        </div>

        {questions.length > 0 ? (
          questions.map((item, index) => (
            <Card key={index} className="bg-gradient-to-r from-teal-800/30 to-emerald-800/30 border border-teal-500/30 shadow-2xl rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-white/20 rounded-lg flex-shrink-0">
                      {getQuestionIcon(index)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-teal-100 text-sm">Question {item.number}</span>
                      <h3 className="text-base sm:text-lg font-medium mt-1 break-words">{item.question}</h3>
                    </div>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`Q: ${item.question}\nA: ${item.answer}${item.proTip ? `\nTip: ${item.proTip}` : ''}`, `Question ${item.number}`)}
                    className="text-white hover:bg-white/20 flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {/* Answer */}
                {item.answer && (
                  <div className="bg-gradient-to-r from-teal-50/10 to-emerald-50/10 rounded-xl p-4 border-l-4 border-teal-500">
                    <h4 className="font-bold text-teal-300 text-sm mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 flex-shrink-0" />
                      Your Perfect Answer
                    </h4>
                    <p className="text-gray-200 leading-relaxed text-sm break-words">
                      {item.answer}
                    </p>
                  </div>
                )}

                {/* Pro Tip */}
                {item.proTip && (
                  <div className="bg-gradient-to-r from-emerald-50/10 to-yellow-50/10 rounded-xl p-4 border-l-4 border-emerald-500">
                    <h4 className="font-bold text-emerald-300 text-sm mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 flex-shrink-0" />
                      Pro Interview Tip
                    </h4>
                    <p className="text-gray-200 leading-relaxed text-sm break-words">
                      {item.proTip}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 shadow-2xl rounded-xl overflow-hidden">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                <p className="text-white font-medium">No Questions Available</p>
              </div>
              <p className="text-yellow-100 text-sm break-words">
                The interview questions couldn't be parsed from the data. Please try generating new interview prep.
              </p>
            </CardContent>
          </Card>
        )}
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
