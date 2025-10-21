import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const testConnection = async (config) => {
  try {
    // You can implement an actual test here
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default function ConfigPage() {
  const navigate = useNavigate();
  const [config, setConfig] = useState({
    awsRegion: '',
    awsAccessKey: '',
    awsSecretKey: '',
    bedrockAgentId: '',
    bedrockAgentAliasId: '',
    s3Bucket: '',
    knowledgeBaseId: '',
    githubTokenSecret: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      localStorage.setItem('dispatchConfig', JSON.stringify(config));
      
      const testResult = await testConnection(config);
      if (testResult.success) {
        navigate('/dashboard');
      } else {
        setError('Could not validate AWS credentials');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Configure Your AWS Resources
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connect your AWS resources to start using Dispatch
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                AWS Region
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={config.awsRegion}
                onChange={(e) => setConfig({...config, awsRegion: e.target.value})}
                placeholder="us-east-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                AWS Access Key ID
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={config.awsAccessKey}
                onChange={(e) => setConfig({...config, awsAccessKey: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                AWS Secret Access Key
              </label>
              <input
                type="password"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={config.awsSecretKey}
                onChange={(e) => setConfig({...config, awsSecretKey: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bedrock Agent ID
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={config.bedrockAgentId}
                onChange={(e) => setConfig({...config, bedrockAgentId: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bedrock Agent Alias ID
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={config.bedrockAgentAliasId}
                onChange={(e) => setConfig({...config, bedrockAgentAliasId: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                S3 Bucket Name
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={config.s3Bucket}
                onChange={(e) => setConfig({...config, s3Bucket: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Knowledge Base ID
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={config.knowledgeBaseId}
                onChange={(e) => setConfig({...config, knowledgeBaseId: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                GitHub Token Secret Name
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                value={config.githubTokenSecret}
                onChange={(e) => setConfig({...config, githubTokenSecret: e.target.value})}
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Validating...' : 'Connect Resources'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
