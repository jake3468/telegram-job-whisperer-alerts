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
      <div className="min-h-screen bg-black p-6 md:p-8 lg:p-10">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-2 font-inter">
            Meet Your AI Agents
          </h2>
          <p className="text-base sm:text-xl text-gray-400 font-inter font-light">
            Activate your personal AI agents, ready to guide you through every step of your job hunt.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {agents.map((agent) => (
              <Card key={agent.id} className="rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 md:p-8 lg:p-10">
                <CardHeader className="text-center pb-6">
                  <div className="text-5xl mb-6">{agent.icon}</div>
                  <CardTitle className="text-2xl font-bold text-card-foreground mb-2 font-inter">
                    {agent.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <CardDescription className="text-muted-foreground text-base leading-relaxed font-opensans font-light">
                    {agent.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-0 justify-center">
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium py-3 px-6 rounded-lg transition-all duration-300"
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