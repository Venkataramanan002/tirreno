import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { DataValidationReport } from "@/services/dataValidationReport";

interface DataValidationReportProps {
  report: DataValidationReport;
}

const DataValidationReportComponent = ({ report }: DataValidationReportProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'real':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fake':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'real':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'fake':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'missing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Data Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{report.totalDataPoints}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Real Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{report.realDataPoints}</div>
            <div className="text-xs text-slate-400">100% verified</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Fake Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{report.fakeDataPoints}</div>
            <div className="text-xs text-slate-400">Needs replacement</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Missing Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{report.missingDataPoints}</div>
            <div className="text-xs text-slate-400">Not implemented</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Data Quality Overview</CardTitle>
          <CardDescription className="text-slate-400">
            Real data percentage: {report.realDataPercentage}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Real Data</span>
              <span className="text-sm text-green-400">{report.realDataPoints} points</span>
            </div>
            <Progress value={report.realDataPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Breakdown */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Data Sources Analysis</CardTitle>
          <CardDescription className="text-slate-400">
            Detailed breakdown of each data source and its verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(report.dataSources).map(([key, data]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(data.status)}
                  <div>
                    <div className="font-medium text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-slate-400">{data.description}</div>
                    {data.apiUsed && (
                      <div className="text-xs text-slate-500">API: {data.apiUsed}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(data.status)}>
                    {data.status.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-slate-400">
                    {data.confidence}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recommendations</CardTitle>
          <CardDescription className="text-slate-400">
            Actions needed to improve data quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <span className="text-slate-300">{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional APIs */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Recommended Additional APIs</CardTitle>
          <CardDescription className="text-slate-400">
            APIs that could enhance threat analysis and user security behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.additionalAPIs.map((api, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <ExternalLink className="h-4 w-4 text-cyan-400" />
                <span className="text-slate-300 text-sm">{api}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Report Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-400">
            <p>Generated: {new Date(report.timestamp).toLocaleString()}</p>
            <p>Report ID: {report.timestamp.split('T')[0]}-{Math.random().toString(36).substring(7)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataValidationReportComponent;
