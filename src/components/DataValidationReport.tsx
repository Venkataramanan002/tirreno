import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, ExternalLink, FileDown, FileText, FileJson, Shield, BarChart2 } from "lucide-react";
import { DataValidationReport, DataValidationReportService } from "@/services/dataValidationReport";
import { PDFReportService } from "@/services/pdfReportService";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface DataValidationReportProps {
  initialReport?: DataValidationReport;
}

export default function DataValidationReportComponent({ initialReport }: DataValidationReportProps) {
  const [report, setReport] = useState<DataValidationReport | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<string | null>(null);
  const [plainTextSummary, setPlainTextSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        // Use provided report or generate a real one
        const reportData = initialReport || await DataValidationReportService.generateRealReport();
        setReport(reportData);
        
        // Generate PDF
        const pdfBlob = PDFReportService.generateDataValidationPDF(reportData);
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        
        // Set JSON data and plain text summary
        setJsonData(reportData.jsonSummary || JSON.stringify(reportData, null, 2));
        setPlainTextSummary(reportData.plainTextSummary || generatePlainTextSummary(reportData));
      } catch (error) {
        console.error("Error loading report data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadReport();
    
    // Cleanup function
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [initialReport]);

  const generatePlainTextSummary = (data: DataValidationReport): string => {
    return `
Data Validation Report
Generated: ${new Date(data.timestamp).toLocaleString()}

SUMMARY:
- Total data points analyzed: ${data.totalDataPoints}
- Real data points: ${data.realDataPoints} (${data.realDataPercentage}%)
- Risk score: ${data.dataSources['riskScore']?.data?.score || 'N/A'}/100
- Threat level: ${data.dataSources['threatLevel']?.data?.level || 'N/A'}

USER INFORMATION:
- IP Address: ${data.dataSources['ipAddress']?.data?.ip || 'N/A'}
- Location: ${data.dataSources['location']?.data?.full || 'N/A'}
- ISP: ${data.dataSources['isp']?.data?.name || 'N/A'}

TOP RECOMMENDATIONS:
${data.recommendations.map((rec, i) => `${i+1}. ${rec}`).join('\n')}
`;
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `data-validation-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const downloadJSON = () => {
    if (jsonData) {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-validation-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  
  const downloadPlainText = () => {
    if (plainTextSummary) {
      const blob = new Blob([plainTextSummary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data-validation-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'real':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fake':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'missing':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-white/50" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'real':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'fake':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'missing':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default:
        return 'bg-white/10 text-white/90 hover:bg-white/15 border-white/20';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Email Threat Analysis Report</CardTitle>
          <CardDescription>Loading real-time data...</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={50} className="w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Email Threat Analysis Report</CardTitle>
          <CardDescription>Error loading report data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <div className="h-4 w-4 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalDataPoints}</div>
            <p className="text-xs text-muted-foreground">
              {report.realDataPoints} real, {report.fakeDataPoints} simulated
            </p>
          </CardContent>
        </Card>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Real Data</CardTitle>
          <div className="h-4 w-4 text-green-600">
            <CheckCircle className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{report.realDataPercentage}%</div>
          <Progress value={report.realDataPercentage} className="mt-2" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Security Risk Score</CardTitle>
          <div className="h-4 w-4 text-orange-600">
            <BarChart2 className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{report.dataSources.riskScore?.data?.score || '45'}/100</div>
          <Progress value={report.dataSources.riskScore?.data?.score || 45} className="mt-2" />
        </CardContent>
      </Card>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
          <div className="h-4 w-4 text-blue-600">
            <Shield className="h-4 w-4" />
          </div>
        </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{report.dataSources.threatLevel?.data?.level || 'Low'}</div>
            <p className="text-xs text-muted-foreground">Based on IP and email analysis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <div className="h-4 w-4 text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.dataSources.riskScore?.data?.score || '25'}/100</div>
            <p className="text-xs text-muted-foreground">
              {report.dataSources.riskScore?.data?.category || 'Low'} risk level
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="text-white">Data Quality Overview</CardTitle>
          <CardDescription className="text-white/60">
            Real data percentage: {report.realDataPercentage}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">Real Data</span>
              <span className="text-sm text-green-400">{report.realDataPoints} points</span>
            </div>
            <Progress value={report.realDataPercentage} className="h-2" />
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Breakdown */}
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="text-white">Data Sources Analysis</CardTitle>
          <CardDescription className="text-white/60">
            Detailed breakdown of each data source and its verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(report.dataSources).map(([key, data]) => (
              <div key={key} className="flex items-center justify-between p-4 glass rounded-xl border border-white/10">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(data.status)}
                  <div>
                    <div className="font-medium text-white capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <div className="text-sm text-white/60">{data.description}</div>
                    {data.apiUsed && (
                      <div className="text-xs text-white/50">API: {data.apiUsed}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(data.status)}>
                    {data.status.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-white/60">
                    {data.confidence}% confidence
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="text-white">Recommendations</CardTitle>
          <CardDescription className="text-white/60">
            Actions needed to improve data quality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 glass rounded-xl border border-white/10">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <span className="text-white/80">{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional APIs */}
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="text-white">Recommended Additional APIs</CardTitle>
          <CardDescription className="text-white/60">
            APIs that could enhance threat analysis and user security behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.additionalAPIs.map((api, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
                <ExternalLink className="h-4 w-4 text-cyan-400" />
                <span className="text-white/80 text-sm">{api}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card className="card-hover glass-card-lg">
        <CardHeader>
          <CardTitle className="text-white">Report Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-white/60">
            <p>Generated: {new Date(report.timestamp).toLocaleString()}</p>
            <p>Report ID: {report.timestamp.split('T')[0]}-{Math.random().toString(36).substring(7)}</p>
          </div>
          
          {/* PDF Preview and Download */}
          <div className="mt-4 space-y-4">
            <div className="flex flex-col space-y-2">
              <h3 className="text-white font-medium">Report Downloads</h3>
              <div className="flex items-center space-x-3 flex-wrap gap-2">
                {pdfUrl && (
                  <Button variant="outline" onClick={() => window.open(pdfUrl, '_blank')}>
                    <FileText className="mr-2 h-4 w-4" />
                    Preview Report
                  </Button>
                )}
                <Button variant="outline" className="bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-600" onClick={downloadPDF}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
                <Button variant="outline" className="bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600" onClick={downloadJSON}>
                  <FileJson className="mr-2 h-4 w-4" />
                  Download JSON
                </Button>
                <Button variant="outline" className="bg-amber-700 hover:bg-amber-600 text-white border-amber-600" onClick={downloadPlainText}>
                  <FileText className="mr-2 h-4 w-4" />
                  Download Plain Text
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Data Sources Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources Analysis</CardTitle>
          <CardDescription>Breakdown of data sources and their validation status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(report.dataSources).map(([key, source]: [string, any]) => (
              <div key={key} className="flex items-start space-x-4 rounded-md border p-4">
                <div className={`mt-0.5 rounded-full p-1 ${getStatusColor(source.status)}`}>
                  {getStatusIcon(source.status)}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none capitalize">{key}</p>
                  <p className="text-sm text-muted-foreground">{source.description}</p>
                  {source.apiUsed && (
                    <Badge variant="outline" className="text-xs">
                      {source.apiUsed}
                    </Badge>
                  )}
                  {source.confidence && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>Confidence</span>
                        <span>{source.confidence}%</span>
                      </div>
                      <Progress value={source.confidence} className="h-1 mt-1" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
          <CardDescription>Based on your data analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="mt-0.5 rounded-full bg-blue-100 p-1 text-blue-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Additional APIs */}
      <Card>
        <CardHeader>
          <CardTitle>Additional APIs</CardTitle>
          <CardDescription>Services that could enhance your data</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {report.additionalAPIs.map((api, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="mt-0.5 rounded-full bg-purple-100 p-1 text-purple-600">
                  <ExternalLink className="h-4 w-4" />
                </div>
                <span>{api}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Report Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Report Metadata</CardTitle>
          <CardDescription>Generated on {new Date(report.timestamp).toLocaleString()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Report ID</p>
              <p className="text-sm text-muted-foreground">
                {report.timestamp.split('T')[0]}-{Math.random().toString(36).substring(2, 8)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Data Freshness</p>
              <p className="text-sm text-muted-foreground">
                {Math.floor((Date.now() - new Date(report.timestamp).getTime()) / 60000)} minutes ago
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Component is already exported above
