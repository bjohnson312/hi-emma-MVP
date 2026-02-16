import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, Users, RefreshCw, BarChart3, Edit, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import backend from "~backend/client";
import type { UpcomingSend, CampaignStats } from "~backend/sms_campaigns/types";

interface UpcomingSendsViewProps {
  onBack: () => void;
  onEdit: (campaignId: number) => void;
  onViewStats: (campaignId: number) => void;
  onToggle: (campaignId: number, isActive: boolean) => void;
  onDelete: (campaignId: number) => void;
}

export default function UpcomingSendsView({ onBack, onEdit, onViewStats, onToggle, onDelete }: UpcomingSendsViewProps) {
  const [upcomingSends, setUpcomingSends] = useState<UpcomingSend[]>([]);
  const [loading, setLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'1h' | '6h' | '24h' | '7d' | '30d' | 'all'>('24h');
  const { toast } = useToast();
  
  useEffect(() => {
    loadUpcomingSends();
  }, [timePeriod]);
  
  const loadUpcomingSends = async () => {
    try {
      setLoading(true);
      const response = await backend.sms_campaigns.getUpcomingSends();
      
      const now = new Date();
      const filtered = response.upcoming_sends.filter(send => {
        const sendTime = new Date(send.next_run_at);
        const diffMs = sendTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        
        switch (timePeriod) {
          case '1h': return diffHours <= 1;
          case '6h': return diffHours <= 6;
          case '24h': return diffHours <= 24;
          case '7d': return diffHours <= 168;
          case '30d': return diffHours <= 720;
          case 'all': return true;
          default: return true;
        }
      });
      
      setUpcomingSends(filtered);
    } catch (error) {
      console.error('Failed to load upcoming sends:', error);
      toast({
        title: 'Error',
        description: 'Failed to load upcoming sends',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case '1h': return 'Next Hour';
      case '6h': return 'Next 6 Hours';
      case '24h': return 'Next 24 Hours';
      case '7d': return 'Next 7 Days';
      case '30d': return 'Next 30 Days';
      case 'all': return 'All Upcoming';
      default: return '';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Upcoming SMS Sends</h2>
            <p className="text-sm text-gray-500 mt-1">
              View scheduled SMS messages - {getTimePeriodLabel()}
            </p>
          </div>
        </div>
        <Button onClick={loadUpcomingSends} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <label className="text-sm font-medium text-gray-700">Time Period:</label>
          <div className="flex gap-2">
            {(['1h', '6h', '24h', '7d', '30d', 'all'] as const).map((period) => (
              <Button
                key={period}
                onClick={() => setTimePeriod(period)}
                variant={timePeriod === period ? 'default' : 'outline'}
                size="sm"
                className={timePeriod === period ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                {period === '1h' && '1 Hour'}
                {period === '6h' && '6 Hours'}
                {period === '24h' && '24 Hours'}
                {period === '7d' && '7 Days'}
                {period === '30d' && '30 Days'}
                {period === 'all' && 'All'}
              </Button>
            ))}
          </div>
        </div>
        
        {loading ? (
          <div className="text-center text-gray-500 py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : upcomingSends.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-lg font-medium">No upcoming sends</p>
            <p className="text-sm mt-1">No SMS campaigns scheduled for {getTimePeriodLabel().toLowerCase()}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Showing {upcomingSends.length} upcoming {upcomingSends.length === 1 ? 'send' : 'sends'}
            </div>
            
            {upcomingSends.map((send) => (
              <div key={send.id} className="border border-blue-100 rounded-lg p-5 bg-gradient-to-r from-blue-50 to-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{send.name}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                        {send.time_until_send}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3 leading-relaxed">{send.message_body}</p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <div>
                          <div className="font-medium">{formatDateTime(send.next_run_at)}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">~{send.estimated_recipients} recipients</div>
                          <div className="text-xs text-gray-500">{send.target_group}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <div>
                          <div className="font-medium">Campaign #{send.id}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => onViewStats(send.id)}
                      variant="outline"
                      size="sm"
                      title="View Stats"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => {
                        onBack();
                        onEdit(send.id);
                      }}
                      variant="outline"
                      size="sm"
                      title="Edit Campaign"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Button>
                    
                    <Button
                      onClick={() => onToggle(send.id, false)}
                      variant="outline"
                      size="sm"
                      title="Pause Campaign"
                    >
                      <Power className="w-4 h-4 text-green-600" />
                    </Button>
                    
                    <Button
                      onClick={() => onDelete(send.id)}
                      variant="outline"
                      size="sm"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
