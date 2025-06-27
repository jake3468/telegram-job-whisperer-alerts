
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { securityAudit } from '@/utils/securityAudit';
import { securityMonitor } from '@/utils/securityMonitor';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface SecurityAuditResult {
  score: number;
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    description: string;
    recommendation: string;
  }>;
  recommendations: string[];
  status: 'CRITICAL' | 'HIGH_RISK' | 'MEDIUM_RISK' | 'LOW_RISK' | 'SECURE';
}

const SecurityDashboard = () => {
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);

  const runSecurityAudit = async () => {
    setIsLoading(true);
    try {
      const result = await securityAudit.runSecurityAudit();
      setAuditResult(result);
      setLastAuditTime(new Date());
    } catch (error) {
      console.error('Security audit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runSecurityAudit();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SECURE': return 'text-green-600 bg-green-100';
      case 'LOW_RISK': return 'text-blue-600 bg-blue-100';
      case 'MEDIUM_RISK': return 'text-yellow-600 bg-yellow-100';
      case 'HIGH_RISK': return 'text-orange-600 bg-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SECURE': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'LOW_RISK': return <Shield className="h-5 w-5 text-blue-600" />;
      case 'MEDIUM_RISK': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'HIGH_RISK': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'CRITICAL': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const securityReport = securityMonitor.getSecurityReport();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Dashboard</h2>
          <p className="text-gray-400">Monitor and audit your application's security</p>
        </div>
        <Button 
          onClick={runSecurityAudit} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Auditing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Run Security Audit
            </>
          )}
        </Button>
      </div>

      {auditResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Security Score */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Security Score
              </CardTitle>
              {getStatusIcon(auditResult.status)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {auditResult.score}/100
              </div>
              <Badge className={getStatusColor(auditResult.status)}>
                {auditResult.status.replace('_', ' ')}
              </Badge>
            </CardContent>
          </Card>

          {/* Issues Count */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Security Issues
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {auditResult.issues.length}
              </div>
              <p className="text-xs text-gray-400">
                {auditResult.issues.filter(i => i.severity === 'critical').length} critical
              </p>
            </CardContent>
          </Card>

          {/* Security Events */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                Recent Events
              </CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {securityReport.recentEvents.length}
              </div>
              <p className="text-xs text-gray-400">
                Last hour
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Issues */}
      {auditResult && auditResult.issues.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Security Issues</CardTitle>
            <CardDescription className="text-gray-400">
              Issues found during the security audit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditResult.issues.map((issue, index) => (
              <Alert key={index} className="bg-gray-700 border-gray-600">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{issue.category}</span>
                    <Badge variant={getSeverityColor(issue.severity)}>
                      {issue.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">{issue.description}</p>
                  <p className="text-xs text-gray-400">
                    💡 {issue.recommendation}
                  </p>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {auditResult && auditResult.recommendations.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Security Recommendations</CardTitle>
            <CardDescription className="text-gray-400">
              Actions to improve your security posture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {auditResult.recommendations.map((rec, index) => (
                <li key={index} className="text-gray-200 text-sm flex items-start">
                  <span className="mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {lastAuditTime && (
        <p className="text-xs text-gray-500 text-center">
          Last audit: {lastAuditTime.toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default SecurityDashboard;
