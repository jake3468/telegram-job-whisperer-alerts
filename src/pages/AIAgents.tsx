import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const AIAgents = () => {
  const agents = [
    {
      id: 'job-application',
      icon: '👔',
      title: 'Job Application Agent',
      description: "I'll be your quick helper when you find a job. Share the basics, and I'll give you everything from a tailored resume to HR contacts in one click."
    },
    {
      id: 'job-alerts',
      icon: '🔔',
      title: 'Job Alerts Agent',
      description: "I'll scan the web daily and send you the latest jobs at your chosen time. Fresh, relevant roles delivered right when you need them."
    },
    {
      id: 'resume-builder',
      icon: '📝',
      title: 'Resume Builder Agent',
      description: "I'll turn your resume into a sharp, job-ready version. Clean format, keyword-optimized, and packed with achievements that stand out."
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-purple-950 p-6">
        <div className="text-center mb-12">
          <h1 className="font-orbitron mb-2 drop-shadow tracking-tight font-bold text-4xl flex items-center justify-center gap-2">
            <span>🤖</span>
            <span style={{
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent'
            }} className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-pink-500 bg-clip-text text-purple-500 text-left">
              Meet Your <span className="italic">AI Agents</span>
            </span>
          </h1>
          <p className="text-sm text-purple-100 font-inter font-light mb-3">
            It's time to meet and activate your personal <span className="italic text-pastel-peach">AI agents</span>, ready to guide you through every step of your job hunt.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-white/5 border-white/20 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="text-4xl mb-4">{agent.icon}</div>
                  <CardTitle className="text-xl font-bold text-white mb-2">
                    {agent.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <CardDescription className="text-purple-100 text-sm leading-relaxed text-center">
                    {agent.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-0 pb-6 px-6">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                    onClick={() => {
                      // Future routing will be added here
                      console.log(`Activating ${agent.title}`);
                    }}
                  >
                    Activate Now
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AIAgents;