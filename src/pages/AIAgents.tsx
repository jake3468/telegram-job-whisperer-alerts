import { Layout } from '@/components/Layout';

const AIAgents = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-purple-950 p-6">
        <div className="text-center mb-8">
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
          <p className="text-md text-purple-100 font-inter font-light text-lg mb-3">
            It's time to meet and activate your personal <span className="italic text-pastel-peach">AI agents</span>, ready to guide you through every step of your job hunt.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default AIAgents;